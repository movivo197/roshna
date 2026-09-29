import {NextRequest} from 'next/server';
import {hasAdminSession} from '@/lib/admin-auth';
import {assertMutation,getDb,HttpError,jsonError,rateLimit} from '@/lib/server/platform';
import {isDestination} from '@/lib/product';

export const runtime='nodejs';
export const dynamic='force-dynamic';
function database(){const db=getDb();db.exec('CREATE TABLE IF NOT EXISTS usage_daily (day TEXT NOT NULL, section TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,section))');return db;}
export async function POST(request:Request){
  try{
    assertMutation(request);rateLimit(request,'usage',40,60000);
    if(request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return new Response(null,{status:204});
    if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'قالب درخواست معتبر نیست.');
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'درخواست خالی است.');let total=0;const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>256){await reader.cancel();throw new HttpError(413,'درخواست بزرگ است.')}chunks.push(value)}
    let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new HttpError(400,'درخواست معتبر نیست.')}
    if(!value||typeof value!=='object'||!('section' in value)||!isDestination(value.section)||Object.keys(value).length!==1)throw new HttpError(400,'بخش معتبر نیست.');
    const db=database();const day=new Date().toISOString().slice(0,10);
    db.prepare('INSERT INTO usage_daily(day,section,count) VALUES(?,?,1) ON CONFLICT(day,section) DO UPDATE SET count=count+1').run(day,value.section);
    db.prepare('DELETE FROM usage_daily WHERE day < ?').run(new Date(Date.now()-90*86400000).toISOString().slice(0,10));
    return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  }catch(error){return jsonError(error)}
}
export async function GET(request:NextRequest){
  try{if(!hasAdminSession(request))throw new HttpError(401,'ابتدا وارد مدیریت شوید.');rateLimit(request,'usage-admin',30,60000);const since=new Date(Date.now()-30*86400000).toISOString().slice(0,10);const rows=database().prepare('SELECT day,section,count FROM usage_daily WHERE day >= ? ORDER BY day DESC,section').all(since);return Response.json({rows,retentionDays:90,notice:'شمارش بازدید با رضایت کاربر؛ این عدد تعداد کاربران یکتا نیست.'},{headers:{'Cache-Control':'no-store'}});}catch(error){return jsonError(error)}
}
