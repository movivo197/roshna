import {z} from 'zod';
import {assertMutation,getDb,json,jsonError,rateLimit,readJson,requireMember,revokeOtherSessions,sessionOverview} from '@/lib/server/platform';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{const user=requireMember(request);rateLimit(request,`account-read:${user.id}`,30,60000);const url=new URL(request.url);
    if(url.searchParams.get('export')==='messages'){
      const cursor=z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).parse(url.searchParams.get('cursor')||0);
      const rows=getDb().prepare('SELECT rowid AS cursor,id,room_id AS roomId,body,created_at AS createdAt,hidden FROM community_messages WHERE author_id=? AND rowid>? ORDER BY rowid LIMIT 200').all(user.id,cursor);
      return json({memberId:user.id,messages:rows,next:rows.length===200?Number(rows[rows.length-1].cursor):null});
    }
    return json({user,sessions:sessionOverview(request),exportedAt:new Date().toISOString()});
  }catch(error){return jsonError(error)}
}
export async function POST(request:Request){try{assertMutation(request);const user=requireMember(request);rateLimit(request,`account-sessions:${user.id}`,5,60000);z.object({action:z.literal('revoke-others')}).strict().parse(await readJson(request,256));revokeOtherSessions(request);return json({ok:true,sessions:sessionOverview(request)});}catch(error){return jsonError(error)}}
