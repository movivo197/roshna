import 'server-only';
import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { hasAdminSession } from '../admin-auth';
import { getDb, HttpError, json, readJson, transaction } from '../server/platform';

function requireAdmin(request: NextRequest) { if (!hasAdminSession(request)) throw new HttpError(401, 'ابتدا وارد پنل مدیریت شوید.'); }
export function adminOverview(request: NextRequest): Response {
  requireAdmin(request); const db = getDb();
  const counts = { members: Number(db.prepare('SELECT COUNT(*) AS n FROM members WHERE suspended=0').get()?.n || 0), messages: Number(db.prepare('SELECT COUNT(*) AS n FROM community_messages WHERE hidden=0').get()?.n || 0), reports: Number(db.prepare("SELECT COUNT(*) AS n FROM community_reports WHERE status='open'").get()?.n || 0) };
  const reports = db.prepare("SELECT r.*, reporter.display_name AS reporter_name, msg.body AS message_body, COALESCE(r.member_id,msg.author_id) AS target_id, target.display_name AS target_name, target.suspended AS target_suspended FROM community_reports r JOIN members reporter ON reporter.id=r.reporter_id LEFT JOIN community_messages msg ON msg.id=r.message_id LEFT JOIN members target ON target.id=COALESCE(r.member_id,msg.author_id) ORDER BY CASE WHEN r.status='open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 100").all();
  const suspended = db.prepare("SELECT id,username,display_name FROM members WHERE suspended=1 AND username NOT LIKE 'deleted_%' ORDER BY display_name LIMIT 100").all();
  return json({ counts, reports, suspended });
}
export async function adminAction(request: NextRequest): Promise<Response> {
  requireAdmin(request); const input = z.object({ action: z.enum(['resolve','hide-message','suspend','restore']), reportId: z.string().max(80).optional(), memberId: z.string().max(80).optional() }).strict().parse(await readJson(request));
  const db = getDb();
  transaction(() => {
    const report = input.reportId ? db.prepare('SELECT r.*,m.author_id FROM community_reports r LEFT JOIN community_messages m ON m.id=r.message_id WHERE r.id=?').get(input.reportId) : undefined;
    if (input.action !== 'restore' && !report) throw new HttpError(404, 'گزارش پیدا نشد.');
    let target = String(report?.member_id || report?.author_id || '');
    if (input.action === 'hide-message') {
      if (!report?.message_id) throw new HttpError(400, 'این گزارش مربوط به پیام نیست.');
      db.prepare('UPDATE community_messages SET hidden=1 WHERE id=?').run(String(report.message_id));
      db.prepare('DELETE FROM community_attachments WHERE message_id=?').run(String(report.message_id));
      target = String(report.message_id);
    }
    if (input.action === 'suspend') { db.prepare('UPDATE members SET suspended=1 WHERE id=?').run(target); db.prepare('DELETE FROM member_sessions WHERE member_id=?').run(target); }
    if (input.action === 'restore') {
      if (!input.memberId || !db.prepare("SELECT 1 FROM members WHERE id=? AND username NOT LIKE 'deleted_%'").get(input.memberId)) throw new HttpError(404, 'حساب پیدا نشد.');
      db.prepare('UPDATE members SET suspended=0 WHERE id=?').run(input.memberId); target = input.memberId;
    }
    if (report) db.prepare("UPDATE community_reports SET status='resolved' WHERE id=?").run(String(report.id));
    db.prepare('INSERT INTO community_audit(id,action,target_id,created_at) VALUES(?,?,?,?)').run(randomBytes(16).toString('hex'), input.action, target || String(report?.id), new Date().toISOString());
  });
  return json({ ok: true });
}
