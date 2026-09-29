import 'server-only';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { addNotification, createMemberSession, getDb, HttpError, isBlocked, json, publicMember, readJson, requireMember, revokeMemberSession, transaction, type Member } from '../server/platform';
import type { CommunityMessage, CommunityPerson, CommunityRoom } from './types';

const id = () => randomBytes(16).toString('hex');
const now = () => new Date().toISOString();
const idSchema = z.string().min(1).max(80).regex(/^[a-zA-Z0-9-]+$/);
const username = z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z][a-z0-9_]*$/);
const password = z.string().min(10).max(128);
const name = z.string().trim().min(2).max(50);
const emojis = ['❤️', '👏', '✨', '👍', '😂'] as const;
type Row = Record<string, unknown>;

async function derive(value: string, salt: string): Promise<Buffer> { return new Promise((resolve, reject) => scrypt(value, salt, 64, { N: 16384, r: 8, p: 1 }, (error, result) => error ? reject(error) : resolve(result))); }
async function hashPassword(value: string): Promise<string> { const salt = randomBytes(16).toString('hex'); return `${salt}:${(await derive(value, salt)).toString('hex')}`; }
async function verifyPassword(value: string, stored: string): Promise<boolean> { const [salt, hash] = stored.split(':'); const actual = await derive(value, salt); const expected = Buffer.from(hash, 'hex'); return actual.length === expected.length && timingSafeEqual(actual, expected); }

export async function sessionAction(request: Request): Promise<Response> {
  const input = z.discriminatedUnion('action', [
    z.object({ action: z.literal('register'), username, displayName: name, password, accepted: z.literal(true) }).strict(),
    z.object({ action: z.literal('login'), username, password: z.string().min(1).max(128) }).strict(),
    z.object({ action: z.literal('logout') }).strict(),
  ]).parse(await readJson(request));
  if (input.action === 'logout') return json({ user: null }, 200, { 'Set-Cookie': revokeMemberSession(request) });
  const db = getDb();
  if (input.action === 'register') {
    if (db.prepare('SELECT 1 FROM members WHERE username=?').get(input.username)) throw new HttpError(409, 'این نام کاربری قبلاً انتخاب شده است.');
    const passwordHash = await hashPassword(input.password); const memberId = id(); const time = now();
    try { db.prepare('INSERT INTO members(id,username,display_name,password_hash,created_at,last_seen_at) VALUES(?,?,?,?,?,?)').run(memberId, input.username, input.displayName, passwordHash, time, time); }
    catch (error) { if (db.prepare('SELECT 1 FROM members WHERE username=?').get(input.username)) throw new HttpError(409, 'این نام کاربری قبلاً انتخاب شده است.'); throw error; }
    const member = publicMember(db.prepare('SELECT * FROM members WHERE id=?').get(memberId)!);
    return json({ user: member }, 201, { 'Set-Cookie': createMemberSession(memberId) });
  }
  const row = db.prepare('SELECT * FROM members WHERE username=?').get(input.username);
  // A fixed dummy derivation avoids a fast response for an unknown account.
  const matched = await verifyPassword(input.password, String(row?.password_hash || '00000000000000000000000000000000:' + '0'.repeat(128)));
  if (!row || !matched || row.suspended) throw new HttpError(401, 'اطلاعات ورود معتبر نیست یا دسترسی این حساب محدود شده است.');
  return json({ user: publicMember(row) }, 200, { 'Set-Cookie': createMemberSession(String(row.id)) });
}

export async function updateProfile(request: Request): Promise<Response> {
  const member = requireMember(request);
  const input = z.object({
    displayName: name,
    bio: z.string().trim().max(240).default(''),
    avatar: z.string().trim().max(2000).optional(),
    gender: z.enum(['male', 'female', 'other', 'unspecified']).optional(),
    age: z.number().int().min(0).max(120).optional(),
  }).strict().parse(await readJson(request));

  getDb().prepare('UPDATE members SET display_name=?, bio=?, avatar=?, gender=?, age=? WHERE id=?')
    .run(
      input.displayName,
      input.bio,
      input.avatar || member.avatar || '',
      input.gender || member.gender || 'unspecified',
      input.age ?? member.age ?? 0,
      member.id
    );
  return json({ user: publicMember(getDb().prepare('SELECT * FROM members WHERE id=?').get(member.id)!) });
}

function person(row: Row, viewer: Member): CommunityPerson {
  const db = getDb(); const memberId = String(row.id);
  const relationship = db.prepare('SELECT * FROM member_friends WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)').get(viewer.id, memberId, memberId, viewer.id);
  return { ...publicMember(row), online: Date.now() - Date.parse(String(row.last_seen_at)) < 120_000, following: Boolean(db.prepare('SELECT 1 FROM member_follows WHERE follower_id=? AND followed_id=?').get(viewer.id, memberId)), friendship: !relationship ? 'none' : relationship.status === 'accepted' ? 'accepted' : relationship.requester_id === viewer.id ? 'sent' : 'received' };
}
export function listPeople(request: Request): Response {
  const viewer = requireMember(request); const query = new URL(request.url).searchParams.get('q')?.trim().slice(0,50) || '';
  const db = getDb();
  const rows = db.prepare("SELECT * FROM members m WHERE id<>? AND suspended=0 AND (instr(username,?)>0 OR instr(display_name,?)>0) AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_id=? AND b.blocked_id=m.id) OR (b.blocker_id=m.id AND b.blocked_id=?)) ORDER BY last_seen_at DESC LIMIT 50").all(viewer.id, query.toLowerCase(), query, viewer.id, viewer.id);
  const blocked = db.prepare('SELECT m.id,m.display_name FROM member_blocks b JOIN members m ON m.id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at DESC LIMIT 100').all(viewer.id).map(row => ({ id: String(row.id), displayName: String(row.display_name) }));
  return json({ people: rows.map(row => person(row, viewer)), blocked });
}

export async function relationAction(request: Request): Promise<Response> {
  const viewer = requireMember(request); const input = z.object({ action: z.enum(['follow','unfollow','request','accept','remove','block','unblock']), memberId: idSchema }).strict().parse(await readJson(request));
  if (input.memberId === viewer.id) throw new HttpError(400, 'این عملیات روی حساب خودتان ممکن نیست.');
  const db = getDb(); const target = db.prepare('SELECT * FROM members WHERE id=? AND suspended=0').get(input.memberId);
  if (!target) throw new HttpError(404, 'کاربر پیدا نشد.');
  if (input.action === 'unblock') { db.prepare('DELETE FROM member_blocks WHERE blocker_id=? AND blocked_id=?').run(viewer.id, input.memberId); return json({ ok: true }); }
  if (input.action === 'block') {
    transaction(() => {
      db.prepare('INSERT OR IGNORE INTO member_blocks(blocker_id,blocked_id,created_at) VALUES(?,?,?)').run(viewer.id, input.memberId, now());
      db.prepare('DELETE FROM member_friends WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)').run(viewer.id, input.memberId, input.memberId, viewer.id);
      db.prepare('DELETE FROM member_follows WHERE (follower_id=? AND followed_id=?) OR (follower_id=? AND followed_id=?)').run(viewer.id, input.memberId, input.memberId, viewer.id);
    }); return json({ ok: true });
  }
  if (isBlocked(viewer.id, input.memberId)) throw new HttpError(403, 'تعامل با این حساب در دسترس نیست.');
  if (input.action === 'follow') db.prepare('INSERT OR IGNORE INTO member_follows(follower_id,followed_id) VALUES(?,?)').run(viewer.id, input.memberId);
  if (input.action === 'unfollow') db.prepare('DELETE FROM member_follows WHERE follower_id=? AND followed_id=?').run(viewer.id, input.memberId);
  if (input.action === 'request') transaction(() => {
    if (db.prepare('SELECT 1 FROM member_friends WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)').get(viewer.id, input.memberId, input.memberId, viewer.id)) return;
    db.prepare("INSERT INTO member_friends(requester_id,recipient_id,status,created_at) VALUES(?,?,'pending',?)").run(viewer.id, input.memberId, now());
    addNotification(input.memberId, { kind: 'friend', title: `${viewer.displayName} درخواست دوستی فرستاد.`, href: '/#community' });
  });
  if (input.action === 'accept') transaction(() => {
    const result = db.prepare("UPDATE member_friends SET status='accepted' WHERE requester_id=? AND recipient_id=? AND status='pending'").run(input.memberId, viewer.id);
    if (!result.changes) throw new HttpError(409, 'درخواست دوستی فعالی وجود ندارد.');
    addNotification(input.memberId, { kind: 'friend', title: `${viewer.displayName} درخواست دوستی را پذیرفت.`, href: '/#community' });
  });
  if (input.action === 'remove') db.prepare('DELETE FROM member_friends WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)').run(viewer.id, input.memberId, input.memberId, viewer.id);
  return json({ ok: true });
}

export function assertRoom(roomId: string, memberId: string): Row {
  const db = getDb(); const room = db.prepare('SELECT * FROM community_rooms WHERE id=?').get(roomId);
  if (!room) throw new HttpError(404, 'گفتگو پیدا نشد.');
  if (room.kind !== 'public' && !db.prepare('SELECT 1 FROM community_memberships WHERE room_id=? AND member_id=?').get(roomId, memberId)) throw new HttpError(403, 'ابتدا عضو این گفتگو شوید.');
  if (room.kind === 'dm') {
    const peer = db.prepare('SELECT m.id,m.suspended FROM community_memberships cm JOIN members m ON m.id=cm.member_id WHERE cm.room_id=? AND cm.member_id<>?').get(roomId, memberId);
    if (!peer || peer.suspended || isBlocked(memberId, String(peer.id))) throw new HttpError(403, 'این گفتگو در دسترس نیست.');
  }
  return room;
}
function roomInfo(row: Row, member: Member): CommunityRoom | null {
  const db = getDb(); let label = String(row.name); let peerId: string | undefined;
  if (row.kind === 'dm') {
    const peer = db.prepare('SELECT m.* FROM members m JOIN community_memberships cm ON cm.member_id=m.id WHERE cm.room_id=? AND m.id<>?').get(String(row.id), member.id);
    if (!peer || peer.suspended || isBlocked(member.id, String(peer.id))) return null;
    label = String(peer.display_name); peerId = String(peer.id);
  }
  return { id: String(row.id), kind: row.kind as CommunityRoom['kind'], name: label, ownerId: row.owner_id ? String(row.owner_id) : null, memberCount: Number(db.prepare('SELECT COUNT(*) AS count FROM community_memberships WHERE room_id=?').get(String(row.id))?.count || 0), updatedAt: String(row.updated_at), ...(peerId ? { peerId } : {}) };
}
export function listRooms(request: Request): Response {
  const member = requireMember(request); const db = getDb();
  const rooms = db.prepare("SELECT r.* FROM community_rooms r WHERE r.kind='public' OR EXISTS(SELECT 1 FROM community_memberships m WHERE m.room_id=r.id AND m.member_id=?) ORDER BY r.updated_at DESC LIMIT 100").all(member.id).map(row => roomInfo(row, member)).filter(Boolean);
  const discover = db.prepare("SELECT r.* FROM community_rooms r JOIN members owner ON owner.id=r.owner_id AND owner.suspended=0 WHERE r.kind='group' AND NOT EXISTS(SELECT 1 FROM community_memberships m WHERE m.room_id=r.id AND m.member_id=?) AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_id=? AND b.blocked_id=r.owner_id) OR (b.blocker_id=r.owner_id AND b.blocked_id=?)) ORDER BY r.created_at DESC LIMIT 30").all(member.id, member.id, member.id).map(row => roomInfo(row, member));
  return json({ rooms, discover });
}

export async function roomAction(request: Request): Promise<Response> {
  const member = requireMember(request); const input = z.discriminatedUnion('action', [
    z.object({ action: z.literal('create'), name: z.string().trim().min(3).max(60) }).strict(),
    z.object({ action: z.literal('dm'), memberId: idSchema }).strict(),
    z.object({ action: z.literal('join'), roomId: idSchema }).strict(),
    z.object({ action: z.literal('leave'), roomId: idSchema }).strict(),
    z.object({ action: z.literal('invite'), roomId: idSchema, memberId: idSchema }).strict(),
  ]).parse(await readJson(request));
  const db = getDb();
  const result = transaction(() => {
    if (input.action === 'create') {
      if (Number(db.prepare("SELECT COUNT(*) AS count FROM community_rooms WHERE owner_id=? AND kind='group'").get(member.id)?.count) >= 10) throw new HttpError(409, 'هر حساب می‌تواند تا ۱۰ گروه بسازد.');
      const roomId = id(); const time = now(); db.prepare("INSERT INTO community_rooms(id,kind,name,owner_id,created_at,updated_at) VALUES(?,'group',?,?,?,?)").run(roomId, input.name, member.id, time, time);
      db.prepare('INSERT INTO community_memberships(room_id,member_id) VALUES(?,?)').run(roomId, member.id); return { roomId };
    }
    if (input.action === 'dm') {
      if (member.id === input.memberId || isBlocked(member.id, input.memberId)) throw new HttpError(403, 'این گفتگو در دسترس نیست.');
      if (!db.prepare('SELECT 1 FROM members WHERE id=? AND suspended=0').get(input.memberId)) throw new HttpError(404, 'کاربر پیدا نشد.');
      if (!db.prepare("SELECT 1 FROM member_friends WHERE status='accepted' AND ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?))").get(member.id, input.memberId, input.memberId, member.id)) throw new HttpError(403, 'گفتگوی خصوصی پس از پذیرش دوستی فعال می‌شود.');
      const key = [member.id, input.memberId].sort().join(':'); const existing = db.prepare('SELECT id FROM community_rooms WHERE dm_key=?').get(key);
      if (existing) return { roomId: String(existing.id) };
      const roomId = id(); const time = now(); db.prepare("INSERT INTO community_rooms(id,kind,name,dm_key,created_at,updated_at) VALUES(?,'dm','',?,?,?)").run(roomId, key, time, time);
      db.prepare('INSERT INTO community_memberships(room_id,member_id) VALUES(?,?),(?,?)').run(roomId, member.id, roomId, input.memberId); return { roomId };
    }
    if (input.action === 'join') {
      const room = db.prepare("SELECT r.* FROM community_rooms r JOIN members m ON m.id=r.owner_id AND m.suspended=0 WHERE r.id=? AND r.kind='group'").get(input.roomId);
      if (!room || isBlocked(member.id, String(room.owner_id))) throw new HttpError(404, 'گروه در دسترس نیست.');
      if (Number(db.prepare('SELECT COUNT(*) AS count FROM community_memberships WHERE room_id=?').get(input.roomId)?.count) >= 100) throw new HttpError(409, 'ظرفیت این گروه تکمیل است.');
      db.prepare('INSERT OR IGNORE INTO community_memberships(room_id,member_id) VALUES(?,?)').run(input.roomId, member.id); return { roomId: input.roomId };
    }
    const room = assertRoom(input.roomId, member.id);
    if (room.kind !== 'group') throw new HttpError(400, 'این عملیات مخصوص گروه است.');
    if (input.action === 'leave') {
      if (room.owner_id === member.id) throw new HttpError(409, 'سازنده گروه نمی‌تواند گروه را ترک کند.');
      db.prepare('DELETE FROM community_memberships WHERE room_id=? AND member_id=?').run(input.roomId, member.id); return { ok: true };
    }
    if (input.action !== 'invite') throw new HttpError(400, 'عملیات نامعتبر است.');
    if (isBlocked(member.id, input.memberId) || !db.prepare('SELECT 1 FROM members WHERE id=? AND suspended=0').get(input.memberId)) throw new HttpError(403, 'ارسال دعوت به این حساب ممکن نیست.');
    if (!db.prepare("SELECT 1 FROM member_friends WHERE status='accepted' AND ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?))").get(member.id, input.memberId, input.memberId, member.id)) throw new HttpError(403, 'دعوت گروه فقط برای دوستان فعال است.');
    addNotification(input.memberId, { kind: 'invite', title: `${member.displayName} شما را به گروه «${String(room.name)}» دعوت کرد. از کشف گروه‌ها عضو شوید.`, href: '/#community' });
    return { ok: true };
  });
  return json(result);
}

function visibleMessage(messageId: string, member: Member): Row {
  const row = getDb().prepare('SELECT msg.* FROM community_messages msg JOIN members m ON m.id=msg.author_id AND m.suspended=0 WHERE msg.id=? AND msg.hidden=0').get(messageId);
  if (!row || isBlocked(member.id, String(row.author_id))) throw new HttpError(404, 'پیام در دسترس نیست.');
  assertRoom(String(row.room_id), member.id); return row;
}

export function listMessages(request: Request): Response {
  const member = requireMember(request); const roomId = idSchema.parse(new URL(request.url).searchParams.get('room')); assertRoom(roomId, member.id);
  const db = getDb();
  const rows = db.prepare('SELECT msg.* FROM community_messages msg JOIN members m ON m.id=msg.author_id AND m.suspended=0 WHERE room_id=? AND hidden=0 AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_id=? AND b.blocked_id=msg.author_id) OR (b.blocker_id=msg.author_id AND b.blocked_id=?)) ORDER BY created_at DESC,id DESC LIMIT 50').all(roomId, member.id, member.id);
  const messages: CommunityMessage[] = rows.reverse().map(row => {
    const attachment = db.prepare('SELECT id,name,mime,size FROM community_attachments WHERE message_id=?').get(String(row.id));
    const reactions = db.prepare('SELECT emoji,COUNT(*) AS count,MAX(CASE WHEN member_id=? THEN 1 ELSE 0 END) AS mine FROM community_reactions r WHERE message_id=? AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_id=? AND b.blocked_id=r.member_id) OR (b.blocker_id=r.member_id AND b.blocked_id=?)) GROUP BY emoji').all(member.id, String(row.id), member.id, member.id).map(reaction => ({ emoji: String(reaction.emoji), count: Number(reaction.count), mine: Boolean(reaction.mine) }));
    return { id: String(row.id), body: String(row.body), createdAt: String(row.created_at), author: publicMember(db.prepare('SELECT * FROM members WHERE id=?').get(String(row.author_id))!), own: row.author_id === member.id, attachment: attachment ? { id: String(attachment.id), name: String(attachment.name), mime: String(attachment.mime), size: Number(attachment.size) } : null, reactions };
  });
  return json({ messages, limit: 50 });
}

const attachmentSchema = z.object({ name: z.string().min(1).max(120), mime: z.enum(['image/png','image/jpeg','image/webp','application/pdf','text/plain']), data: z.string().max(1_398_104).regex(/^[A-Za-z0-9+/]*={0,2}$/) }).strict();
function validateAttachment(input: z.infer<typeof attachmentSchema>) {
  const content = Buffer.from(input.data, 'base64');
  if (!content.length || content.length > 1_048_576) throw new HttpError(413, 'اندازه فایل باید حداکثر ۱ مگابایت باشد.');
  const valid = input.mime === 'image/png' ? content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : input.mime === 'image/jpeg' ? content[0] === 255 && content[1] === 216 && content[2] === 255 : input.mime === 'image/webp' ? content.toString('ascii',0,4) === 'RIFF' && content.toString('ascii',8,12) === 'WEBP' : input.mime === 'application/pdf' ? content.toString('ascii',0,5) === '%PDF-' : !content.includes(0) && !content.toString('utf8').includes('\uFFFD');
  if (!valid) throw new HttpError(400, 'محتوای فایل با نوع انتخاب‌شده سازگار نیست.');
  const filename = input.name.replace(/[\x00-\x1f\x7f/\\<>:"|?*]/g, '_').slice(0,100) || 'attachment';
  return { content, name: filename, mime: input.mime };
}
export async function messageAction(request: Request): Promise<Response> {
  const member = requireMember(request); const input = z.discriminatedUnion('action', [
    z.object({ action: z.literal('send'), roomId: idSchema, body: z.string().trim().max(2000), attachment: attachmentSchema.optional() }).strict(),
    z.object({ action: z.literal('react'), messageId: idSchema, emoji: z.enum(emojis) }).strict(),
    z.object({ action: z.literal('delete'), messageId: idSchema }).strict(),
  ]).parse(await readJson(request, 1_450_000));
  const db = getDb();
  const result = transaction(() => {
    if (input.action === 'send') {
      const room = assertRoom(input.roomId, member.id); if (!input.body && !input.attachment) throw new HttpError(400, 'متن یا فایل پیام را وارد کنید.');
      const file = input.attachment ? validateAttachment(input.attachment) : null;
      if (file) {
        const total = Number(db.prepare('SELECT COALESCE(SUM(a.size),0) AS size FROM community_attachments a JOIN community_messages m ON m.id=a.message_id WHERE m.author_id=?').get(member.id)?.size);
        if (total + file.content.length > 50 * 1024 * 1024) throw new HttpError(413, 'سهمیه ۵۰ مگابایتی فایل‌های این حساب تکمیل شده است.');
      }
      const messageId = id(); const time = now();
      db.prepare('INSERT INTO community_messages(id,room_id,author_id,body,created_at) VALUES(?,?,?,?,?)').run(messageId, input.roomId, member.id, input.body, time);
      if (file) db.prepare('INSERT INTO community_attachments(id,message_id,name,mime,size,content) VALUES(?,?,?,?,?,?)').run(id(), messageId, file.name, file.mime, file.content.length, file.content);
      db.prepare('UPDATE community_rooms SET updated_at=? WHERE id=?').run(time, input.roomId);
      const count = Number(db.prepare('SELECT COUNT(*) AS count FROM community_messages WHERE author_id=? AND created_at>=?').get(member.id, time.slice(0,10))?.count);
      if (count <= 10) db.prepare('UPDATE members SET xp=xp+1 WHERE id=?').run(member.id);
      if (room.kind === 'dm') {
        const recipient = db.prepare('SELECT member_id FROM community_memberships WHERE room_id=? AND member_id<>?').get(input.roomId, member.id);
        if (recipient) addNotification(String(recipient.member_id), { kind: 'message', title: `پیام خصوصی جدید از ${member.displayName}`, href: '/#community' });
      }
      return { messageId };
    }
    const message = visibleMessage(input.messageId, member);
    if (input.action === 'delete') {
      const room = assertRoom(String(message.room_id), member.id);
      if (message.author_id !== member.id && room.owner_id !== member.id) throw new HttpError(403, 'اجازه حذف این پیام را ندارید.');
      db.prepare('UPDATE community_messages SET hidden=1 WHERE id=?').run(input.messageId);
      db.prepare('DELETE FROM community_attachments WHERE message_id=?').run(input.messageId); return { ok: true };
    }
    const exists = db.prepare('SELECT 1 FROM community_reactions WHERE message_id=? AND member_id=? AND emoji=?').get(input.messageId, member.id, input.emoji);
    if (exists) db.prepare('DELETE FROM community_reactions WHERE message_id=? AND member_id=? AND emoji=?').run(input.messageId, member.id, input.emoji);
    else db.prepare('INSERT INTO community_reactions(message_id,member_id,emoji) VALUES(?,?,?)').run(input.messageId, member.id, input.emoji);
    return { ok: true };
  });
  return json(result);
}

export function downloadFile(request: Request): Response {
  const member = requireMember(request); const fileId = idSchema.parse(new URL(request.url).searchParams.get('id'));
  const row = getDb().prepare('SELECT * FROM community_attachments WHERE id=?').get(fileId); if (!row) throw new HttpError(404, 'فایل پیدا نشد.');
  visibleMessage(String(row.message_id), member);
  return new Response(new Uint8Array(row.content as Uint8Array), { headers: { 'Content-Type': String(row.mime), 'Content-Length': String(row.size), 'Content-Disposition': `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(String(row.name)).replace(/'/g,'%27')}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
}

export async function reportAction(request: Request): Promise<Response> {
  const member = requireMember(request); const input = z.object({ messageId: idSchema.optional(), memberId: idSchema.optional(), reason: z.string().trim().min(5).max(500) }).strict().refine(value => Boolean(value.messageId) !== Boolean(value.memberId)).parse(await readJson(request));
  const db = getDb();
  if (input.messageId) visibleMessage(input.messageId, member);
  if (input.memberId && (input.memberId === member.id || !db.prepare('SELECT 1 FROM members WHERE id=?').get(input.memberId))) throw new HttpError(400, 'کاربر گزارش معتبر نیست.');
  if (db.prepare("SELECT 1 FROM community_reports WHERE reporter_id=? AND status='open' AND (message_id=? OR member_id=?)").get(member.id, input.messageId || null, input.memberId || null)) throw new HttpError(409, 'گزارش شما قبلاً ثبت شده است.');
  db.prepare('INSERT INTO community_reports(id,reporter_id,message_id,member_id,reason,created_at) VALUES(?,?,?,?,?,?)').run(id(), member.id, input.messageId || null, input.memberId || null, input.reason, now());
  return json({ ok: true });
}

export function listNotifications(request: Request): Response {
  const member = requireMember(request); const db = getDb();
  const items = db.prepare('SELECT * FROM platform_notifications WHERE member_id=? ORDER BY created_at DESC LIMIT 60').all(member.id).map(row => ({ id: row.id, kind: row.kind, title: row.title, href: row.href, createdAt: row.created_at, read: Boolean(row.is_read) }));
  const unread = Number(db.prepare('SELECT COUNT(*) AS count FROM platform_notifications WHERE member_id=? AND is_read=0').get(member.id)?.count || 0);
  return json({ items, unread });
}
export async function readNotifications(request: Request): Promise<Response> {
  const member = requireMember(request); z.object({ action: z.literal('read-all') }).strict().parse(await readJson(request));
  getDb().prepare('UPDATE platform_notifications SET is_read=1 WHERE member_id=?').run(member.id); return json({ ok: true });
}

export async function accountAction(request: Request): Promise<Response> {
  const member = requireMember(request); const input = z.discriminatedUnion('action', [
    z.object({ action: z.literal('password'), currentPassword: z.string().min(1).max(128), newPassword: password }).strict(),
    z.object({ action: z.literal('delete'), currentPassword: z.string().min(1).max(128) }).strict(),
  ]).parse(await readJson(request));
  const db = getDb(); const row = db.prepare('SELECT password_hash FROM members WHERE id=?').get(member.id)!;
  if (!(await verifyPassword(input.currentPassword, String(row.password_hash)))) throw new HttpError(401, 'رمز فعلی درست نیست.');
  if (input.action === 'password') {
    const value = await hashPassword(input.newPassword);
    transaction(() => { db.prepare('UPDATE members SET password_hash=? WHERE id=?').run(value, member.id); db.prepare('DELETE FROM member_sessions WHERE member_id=?').run(member.id); });
    return json({ ok: true }, 200, { 'Set-Cookie': createMemberSession(member.id) });
  }
  transaction(() => {
    db.prepare("UPDATE members SET username=?,display_name='حساب حذف‌شده',bio='',password_hash='',suspended=1 WHERE id=?").run(`deleted_${id().slice(0,16)}`, member.id);
    db.prepare('DELETE FROM member_vaults WHERE member_id=?').run(member.id);
    db.prepare('DELETE FROM member_sessions WHERE member_id=?').run(member.id);
    db.prepare('DELETE FROM community_attachments WHERE message_id IN (SELECT id FROM community_messages WHERE author_id=?)').run(member.id);
    db.prepare("UPDATE community_messages SET hidden=1,body='' WHERE author_id=?").run(member.id);
    db.prepare('DELETE FROM community_reactions WHERE member_id=?').run(member.id);
    db.prepare('DELETE FROM platform_notifications WHERE member_id=?').run(member.id);
    db.prepare('DELETE FROM member_follows WHERE follower_id=? OR followed_id=?').run(member.id, member.id);
    db.prepare('DELETE FROM member_friends WHERE requester_id=? OR recipient_id=?').run(member.id, member.id);
    db.prepare('DELETE FROM member_blocks WHERE blocker_id=? OR blocked_id=?').run(member.id, member.id);
  });
  return json({ ok: true }, 200, { 'Set-Cookie': revokeMemberSession(request) });
}

export async function anonymousAction(request: Request): Promise<Response> {
  const member = requireMember(request);
  const db = getDb();

  // Validate required profile fields for anonymous chat
  if (!member.gender || member.gender === 'unspecified' || !member.age || member.age < 12 || member.displayName.trim().length < 2) {
    throw new HttpError(400, 'برای ورود به چت ناشناس، تکمیل نام، جنسیت و سن در پروفایل الزامی است.');
  }

  const input = z.discriminatedUnion('action', [
    z.object({
      action: z.literal('find'),
      preferredGender: z.enum(['any', 'male', 'female']),
    }).strict(),
    z.object({
      action: z.literal('leave'),
      roomId: idSchema.optional(),
      queueId: idSchema.optional(),
    }).strict(),
    z.object({
      action: z.literal('reveal'),
      roomId: idSchema,
    }).strict(),
  ]).parse(await readJson(request));

  if (input.action === 'leave') {
    if (input.queueId) {
      db.prepare("UPDATE anonymous_queue SET status='cancelled' WHERE id=? AND member_id=?").run(input.queueId, member.id);
    }
    if (input.roomId) {
      db.prepare("INSERT INTO community_messages(id,room_id,author_id,body,created_at) VALUES(?,?,?,?,?)")
        .run(id(), input.roomId, member.id, 'هم‌صحبت شما گفتگو را ترک کرد.', now());
    }
    return json({ ok: true });
  }

  if (input.action === 'reveal') {
    const genderLabel = member.gender === 'male' ? 'پسر' : member.gender === 'female' ? 'دختر' : '';
    const bodyText = `✨ هم‌صحبت شما مایل به آشنایی است: «${member.displayName}» (${genderLabel}${member.age ? `، ${member.age} ساله` : ''})`;
    db.prepare("INSERT INTO community_messages(id,room_id,author_id,body,created_at) VALUES(?,?,?,?,?)")
      .run(id(), input.roomId, member.id, bodyText, now());
    return json({ ok: true });
  }

  if (input.action === 'find') {
    db.prepare("UPDATE anonymous_queue SET status='cancelled' WHERE member_id=? AND status='waiting'").run(member.id);

    const query = `
      SELECT q.*, m.display_name, m.gender AS peer_gender, m.age AS peer_age, m.avatar AS peer_avatar
      FROM anonymous_queue q
      JOIN members m ON m.id = q.member_id AND m.suspended = 0
      WHERE q.status = 'waiting'
        AND q.member_id <> ?
        AND (q.preferred_gender = 'any' OR q.preferred_gender = ?)
        AND (? = 'any' OR m.gender = ?)
        AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_id=? AND b.blocked_id=m.id) OR (b.blocker_id=m.id AND b.blocked_id=?))
      ORDER BY q.created_at ASC LIMIT 1
    `;

    const candidate = db.prepare(query).get(
      member.id,
      member.gender,
      input.preferredGender,
      input.preferredGender,
      member.id,
      member.id
    ) as any;

    if (candidate) {
      const roomId = 'anon_' + id();
      const time = now();
      transaction(() => {
        db.prepare("INSERT INTO community_rooms(id,kind,name,owner_id,dm_key,created_at,updated_at) VALUES(?,'dm',?,NULL,?, ?, ?)")
          .run(roomId, 'گفتگوی ناشناس', 'anon:' + roomId, time, time);

        db.prepare("INSERT INTO community_memberships(room_id,member_id) VALUES(?,?),(?,?)")
          .run(roomId, member.id, roomId, candidate.member_id);

        db.prepare("UPDATE anonymous_queue SET status='matched', room_id=? WHERE id=?")
          .run(roomId, candidate.id);

        const peerLabel = candidate.peer_gender === 'male' ? 'پسر' : candidate.peer_gender === 'female' ? 'دختر' : 'هم‌صحبت';
        const welcomeText = `🌱 اتصال برقرار شد! هم‌صحبت شما یک ${peerLabel} ${candidate.peer_age ? `${candidate.peer_age} ساله` : ''} است. پیام خود را با احترام بفرستید.`;
        db.prepare("INSERT INTO community_messages(id,room_id,author_id,body,created_at) VALUES(?,?,?,?,?)")
          .run(id(), roomId, candidate.member_id, welcomeText, time);
      });

      return json({
        status: 'matched',
        roomId,
        peer: {
          gender: candidate.peer_gender,
          age: candidate.peer_age,
        },
      });
    }

    const queueId = id();
    db.prepare("INSERT INTO anonymous_queue(id,member_id,gender,preferred_gender,status,created_at) VALUES(?,?,?,?,'waiting',?)")
      .run(queueId, member.id, member.gender, input.preferredGender, now());

    return json({
      status: 'waiting',
      queueId,
    });
  }

  throw new HttpError(400, 'عملیات نامعتبر است.');
}

export async function anonymousPoll(request: Request): Promise<Response> {
  const member = requireMember(request);
  const queueId = new URL(request.url).searchParams.get('queueId');
  if (!queueId) throw new HttpError(400, 'شناسه صف ارسال نشده است.');

  const db = getDb();
  const row = db.prepare("SELECT * FROM anonymous_queue WHERE id=? AND member_id=?").get(queueId, member.id) as any;
  if (!row) throw new HttpError(404, 'نوبت در صف پیدا نشد.');

  if (row.status === 'matched' && row.room_id) {
    const peerRow = db.prepare(`
      SELECT m.gender, m.age
      FROM community_memberships cm
      JOIN members m ON m.id = cm.member_id
      WHERE cm.room_id = ? AND cm.member_id <> ?
    `).get(row.room_id, member.id) as any;

    return json({
      status: 'matched',
      roomId: row.room_id,
      peer: peerRow ? { gender: peerRow.gender, age: peerRow.age } : null,
    });
  }

  if (row.status === 'cancelled') {
    return json({ status: 'cancelled' });
  }

  return json({ status: 'waiting' });
}

