import {z} from 'zod';
import {assertMutation,requireMember,optionalMember,rateLimit,jsonError,HttpError,readJson} from '../../../lib/server/platform';
import {gameOverview,startGame,moveGame,leaveGame} from '../../../lib/games/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('create'),visibility:z.enum(['public','private'])}).strict(),
  z.object({action:z.literal('queue')}).strict(),
  z.object({action:z.literal('join'),code:z.string().regex(/^[A-F0-9]{12}$/).optional(),id:z.string().uuid().optional()}).strict(),
  z.object({action:z.literal('move'),id:z.string().uuid(),cell:z.number().int().min(0).max(8),revision:z.number().int().min(0)}).strict(),
  z.object({action:z.literal('leave'),id:z.string().uuid()}).strict(),
]);
function response(data:unknown){return Response.json(data,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export async function GET(request:Request){
  try{
    rateLimit(request,'games:read',120,60_000);
    const user=optionalMember(request),id=new URL(request.url).searchParams.get('id');
    if(id&&!z.string().uuid().safeParse(id).success)throw new HttpError(400,'شناسه بازی معتبر نیست.');
    return response(gameOverview(user,id||undefined));
  }catch(error){return jsonError(error)}
}
export async function POST(request:Request){
  try{
    assertMutation(request);const user=requireMember(request);
    rateLimit(request,`games:write:${user.id}`,45,60_000);
    const parsed=await readJson(request,2048);
    const input=schema.safeParse(parsed);if(!input.success)throw new HttpError(400,'اطلاعات بازی معتبر نیست.');
    const value=input.data;
    if(value.action==='move')return response({match:moveGame(user,value.id,value.cell,value.revision)});
    if(value.action==='leave')return response({match:leaveGame(user,value.id)});
    rateLimit(request,`games:lobby:${user.id}`,12,60_000);
    return response({match:startGame(user,value.action,value.action==='create'?value.visibility:'public',value.action==='join'?value.code:undefined,value.action==='join'?value.id:undefined)});
  }catch(error){return jsonError(error)}
}
