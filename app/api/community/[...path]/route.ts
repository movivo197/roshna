import type { NextRequest } from 'next/server';
import { assertMutation, json, jsonError, optionalMember, rateLimit, requireMember } from '../../../../lib/server/platform';
import { accountAction, downloadFile, listMessages, listNotifications, listPeople, listRooms, messageAction, readNotifications, relationAction, reportAction, roomAction, sessionAction, updateProfile } from '../../../../lib/community/service';
import { adminAction, adminOverview } from '../../../../lib/community/moderation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const path = (await context.params).path.join('/');
    rateLimit(request, 'community-read', 300, 60_000);
    if (path === 'session') return json({ user: optionalMember(request) });
    if (path === 'rooms') return listRooms(request);
    if (path === 'people') return listPeople(request);
    if (path === 'messages') return listMessages(request);
    if (path === 'files') return downloadFile(request);
    if (path === 'notifications') return listNotifications(request);
    if (path === 'admin') return adminOverview(request);
    return json({ error: 'مسیر پیدا نشد.' }, 404);
  } catch (error) { return jsonError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    assertMutation(request); const path = (await context.params).path.join('/');
    if (path === 'session') { rateLimit(request, 'community-auth', 12, 15 * 60_000); return await sessionAction(request); }
    if (path === 'admin') { rateLimit(request, 'community-moderation', 60, 60_000); return await adminAction(request); }
    const member = requireMember(request);
    rateLimit(request, `community-write:${member.id}`, 40, 60_000);
    if (path === 'profile') return await updateProfile(request);
    if (path === 'relations') return await relationAction(request);
    if (path === 'rooms') return await roomAction(request);
    if (path === 'messages') return await messageAction(request);
    if (path === 'reports') { rateLimit(request, `community-report:${member.id}`, 10, 60 * 60_000); return await reportAction(request); }
    if (path === 'notifications') return await readNotifications(request);
    if (path === 'account') { rateLimit(request, `community-account:${member.id}`, 5, 15 * 60_000); return await accountAction(request); }
    return json({ error: 'مسیر پیدا نشد.' }, 404);
  } catch (error) { return jsonError(error); }
}
