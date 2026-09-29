import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { isIP } from 'node:net';
import { ZodError } from 'zod';
import type { Member } from '../community/types';
export type { Member } from '../community/types';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const sessionName = 'roshana_member';
const sessionSeconds = 30 * 24 * 60 * 60;
const state = globalThis as typeof globalThis & { __roshanaPlatformDb?: DatabaseSync; __roshanaVaultSchema?: boolean; __roshanaLimits?: Map<string, { count: number; until: number }> };

export function getDb(): DatabaseSync {
  if (state.__roshanaPlatformDb) {
    if (!state.__roshanaVaultSchema) {
      state.__roshanaPlatformDb.exec('CREATE TABLE IF NOT EXISTS member_vaults (member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE, revision INTEGER NOT NULL, envelope TEXT, updated_at TEXT NOT NULL)');
      state.__roshanaVaultSchema = true;
    }
    return state.__roshanaPlatformDb;
  }
  const directory = resolve(process.env.ROSHAN_DATA_DIR || join(process.cwd(), 'data'));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(directory, 'platform.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE, display_name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, suspended INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS member_sessions (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS member_sessions_member ON member_sessions(member_id);
    CREATE TABLE IF NOT EXISTS member_blocks (blocker_id TEXT NOT NULL REFERENCES members(id), blocked_id TEXT NOT NULL REFERENCES members(id), created_at TEXT NOT NULL, PRIMARY KEY(blocker_id,blocked_id), CHECK(blocker_id <> blocked_id));
    CREATE TABLE IF NOT EXISTS member_follows (follower_id TEXT NOT NULL REFERENCES members(id), followed_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(follower_id,followed_id), CHECK(follower_id <> followed_id));
    CREATE TABLE IF NOT EXISTS member_friends (requester_id TEXT NOT NULL REFERENCES members(id), recipient_id TEXT NOT NULL REFERENCES members(id), status TEXT NOT NULL CHECK(status IN ('pending','accepted')), created_at TEXT NOT NULL, PRIMARY KEY(requester_id,recipient_id), CHECK(requester_id <> recipient_id));
    CREATE TABLE IF NOT EXISTS community_rooms (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('public','group','dm')), name TEXT NOT NULL, owner_id TEXT REFERENCES members(id), dm_key TEXT UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS community_memberships (room_id TEXT NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(room_id,member_id));
    CREATE INDEX IF NOT EXISTS community_memberships_member ON community_memberships(member_id,room_id);
    CREATE TABLE IF NOT EXISTS community_messages (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES community_rooms(id), author_id TEXT NOT NULL REFERENCES members(id), body TEXT NOT NULL, created_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS community_messages_room ON community_messages(room_id,created_at DESC);
    CREATE TABLE IF NOT EXISTS community_attachments (id TEXT PRIMARY KEY, message_id TEXT UNIQUE NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, content BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS community_reactions (message_id TEXT NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), emoji TEXT NOT NULL, PRIMARY KEY(message_id,member_id,emoji));
    CREATE TABLE IF NOT EXISTS community_reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES members(id), message_id TEXT REFERENCES community_messages(id), member_id TEXT REFERENCES members(id), reason TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open');
    CREATE TABLE IF NOT EXISTS platform_notifications (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, kind TEXT NOT NULL, title TEXT NOT NULL, href TEXT NOT NULL, created_at TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS platform_notifications_member ON platform_notifications(member_id,created_at DESC);
    CREATE TABLE IF NOT EXISTS community_audit (id TEXT PRIMARY KEY, action TEXT NOT NULL, target_id TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS member_vaults (member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE, revision INTEGER NOT NULL, envelope TEXT, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS anonymous_queue (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, gender TEXT NOT NULL, preferred_gender TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting', room_id TEXT, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS anonymous_queue_status ON anonymous_queue(status, created_at);
  `);
  try { db.exec('ALTER TABLE members ADD COLUMN avatar TEXT DEFAULT ""'); } catch {}
  try { db.exec('ALTER TABLE members ADD COLUMN gender TEXT DEFAULT "unspecified"'); } catch {}
  try { db.exec('ALTER TABLE members ADD COLUMN age INTEGER DEFAULT 0'); } catch {}
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO community_rooms(id,kind,name,created_at,updated_at) VALUES('public-lobby','public','گفتگوی عمومی',?,?)").run(now, now);
  state.__roshanaPlatformDb = db;
  state.__roshanaVaultSchema = true;
  return db;
}

export function transaction<T>(work: () => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try { const result = work(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function publicMember(row: Record<string, unknown>): Member {
  const xp = Number(row.xp || 0);
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    bio: String(row.bio || ''),
    avatar: String(row.avatar || ''),
    gender: (row.gender as any) || 'unspecified',
    age: Number(row.age || 0),
    xp,
    level: Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1,
    createdAt: String(row.created_at),
    lastSeenAt: String(row.last_seen_at),
  };
}

function tokenFrom(request: Request): string | null {
  const raw = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionName}=`))?.slice(sessionName.length + 1);
  return raw && /^[a-f0-9]{64}$/.test(raw) ? raw : null;
}
function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function optionalMember(request: Request): Member | null {
  const token = tokenFrom(request);
  if (!token) return null;
  const row = getDb().prepare('SELECT m.* FROM members m JOIN member_sessions s ON s.member_id=m.id WHERE s.token_hash=? AND s.expires_at>? AND m.suspended=0').get(hashToken(token), Date.now());
  if (!row) return null;
  if (Date.now() - Date.parse(String(row.last_seen_at)) > 60_000) getDb().prepare('UPDATE members SET last_seen_at=? WHERE id=?').run(new Date().toISOString(), String(row.id));
  return publicMember(row);
}
export function requireMember(request: Request): Member { const member = optionalMember(request); if (!member) throw new HttpError(401, 'برای استفاده از این بخش وارد حساب شوید.'); return member; }
export function createMemberSession(memberId: string): string {
  const token = randomBytes(32).toString('hex');
  const db = getDb();
  db.prepare('DELETE FROM member_sessions WHERE expires_at<=?').run(Date.now());
  db.prepare('INSERT INTO member_sessions(token_hash,member_id,expires_at) VALUES(?,?,?)').run(hashToken(token), memberId, Date.now() + sessionSeconds * 1000);
  db.prepare('DELETE FROM member_sessions WHERE member_id=? AND token_hash NOT IN (SELECT token_hash FROM member_sessions WHERE member_id=? ORDER BY expires_at DESC LIMIT 5)').run(memberId, memberId);
  return `${sessionName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function revokeMemberSession(request: Request): string {
  const token = tokenFrom(request);
  if (token) getDb().prepare('DELETE FROM member_sessions WHERE token_hash=?').run(hashToken(token));
  return `${sessionName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function sessionOverview(request:Request){
  const member=requireMember(request),token=tokenFrom(request)!;
  const rows=getDb().prepare('SELECT expires_at,token_hash FROM member_sessions WHERE member_id=? AND expires_at>? ORDER BY expires_at DESC').all(member.id,Date.now());
  return rows.map(row=>({current:String(row.token_hash)===hashToken(token),expiresAt:Number(row.expires_at)}));
}
export function revokeOtherSessions(request:Request){
  const member=requireMember(request),token=tokenFrom(request)!;
  getDb().prepare('DELETE FROM member_sessions WHERE member_id=? AND token_hash<>?').run(member.id,hashToken(token));
}

export function assertMutation(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'مبدأ درخواست معتبر نیست.');
  try {
    const actual = new URL(origin);
    const expected = process.env.ROSHAN_APP_ORIGIN ? new URL(process.env.ROSHAN_APP_ORIGIN) : new URL(request.url);
    if (actual.origin !== expected.origin || (process.env.NODE_ENV === 'production' && actual.protocol !== 'https:')) throw new Error();
  } catch { throw new HttpError(403, 'مبدأ درخواست معتبر نیست.'); }
}

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number): void {
  const entries = state.__roshanaLimits ||= new Map();
  const now = Date.now();
  for (const [key, item] of entries) if (item.until <= now) entries.delete(key);
  const candidate = process.env.ROSHAN_TRUST_PROXY === '1' ? request.headers.get('x-real-ip') || '' : '';
  const key = `${scope}:${isIP(candidate) ? candidate : 'shared'}`;
  let item = entries.get(key);
  if (!item) {
    if (entries.size >= 8192) throw new HttpError(429, 'سرور پرمشغله است. کمی بعد دوباره تلاش کنید.');
    item = { count: 0, until: now + windowMs }; entries.set(key, item);
  }
  if (++item.count > limit) throw new HttpError(429, 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.');
}

export function isBlocked(firstId: string, secondId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM member_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').get(firstId, secondId, secondId, firstId));
}

export function addNotification(userId: string, input: { kind: string; title: string; href: string }): void {
  const db = getDb();
  const href = /^\/#(?:community|games|market|home|settings)/.test(input.href) ? input.href : '/#community';
  db.prepare('INSERT INTO platform_notifications(id,member_id,kind,title,href,created_at) VALUES(?,?,?,?,?,?)').run(randomBytes(16).toString('hex'), userId, input.kind.slice(0,40), input.title.slice(0,240), href, new Date().toISOString());
  db.prepare('DELETE FROM platform_notifications WHERE member_id=? AND id NOT IN (SELECT id FROM platform_notifications WHERE member_id=? ORDER BY created_at DESC LIMIT 300)').run(userId, userId);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } }); }
export function jsonError(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status, error.status === 429 ? { 'Retry-After': '60' } : {});
  if (error instanceof ZodError || error instanceof SyntaxError) return json({ error: 'اطلاعات واردشده معتبر نیست. طول و قالب فیلدها را بررسی کنید.' }, 400);
  console.error('[platform]', error instanceof Error ? error.name : 'unknown');
  return json({ error: 'سرویس موقتاً در دسترس نیست. دوباره تلاش کنید.' }, 503);
}

export async function readJson(request: Request, maximum = 32_000): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'قالب درخواست باید JSON باشد.');
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new HttpError(413, 'حجم درخواست زیاد است.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'درخواست خالی است.');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > maximum) { await reader.cancel(); throw new HttpError(413, 'حجم درخواست زیاد است.'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
