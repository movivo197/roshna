import type {NextRequest} from 'next/server';
import {readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {hasAdminSession,isAdminConfigured} from '@/lib/admin-auth';
import {getDb,HttpError,json,jsonError,rateLimit} from '@/lib/server/platform';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  try{
    if(!hasAdminSession(request))throw new HttpError(401,'ابتدا وارد مدیریت شوید.');rateLimit(request,'operations',15,60000);
    const db=getDb(),directory=resolve(process.cwd(),'backups');
    let backup:{at:string;bytes:number}|null=null;
    try{const folders=(await readdir(directory,{withFileTypes:true})).filter(e=>e.isDirectory()&&/^\d{4}-\d{2}-\d{2}T/.test(e.name)).map(e=>e.name).sort().reverse();for(const folder of folders){try{const info=await stat(join(directory,folder,'platform.sqlite'));backup={at:info.mtime.toISOString(),bytes:info.size};break}catch{}}}catch{}
    const count=(query:string)=>Number(db.prepare(query).get()?.n||0);
    return json({version:'33.0.0',generatedAt:new Date().toISOString(),runtime:process.versions.node,database:'sqlite-single-instance',adminConfigured:isAdminConfigured(),backup,
      counts:{members:count('SELECT COUNT(*) AS n FROM members WHERE suspended=0'),messages:count('SELECT COUNT(*) AS n FROM community_messages WHERE hidden=0'),reports:count("SELECT COUNT(*) AS n FROM community_reports WHERE status='open'"),vaults:count('SELECT COUNT(*) AS n FROM member_vaults WHERE envelope IS NOT NULL')},
      providers:[{name:'GDELT · خبر',configured:true,detail:'بدون کلید؛ وضعیت زنده در صفحه بازار بررسی می‌شود.'},{name:'Frankfurter · نرخ مرجع',configured:true,detail:'بدون کلید؛ این وضعیت، دسترسی زنده را تأیید نمی‌کند.'},{name:'CoinGecko · رمزارز',configured:Boolean(process.env.ROSHAN_COINGECKO_API_KEY&&process.env.ROSHAN_COINGECKO_PLAN==='pro'&&process.env.ROSHAN_COINGECKO_COMMERCIAL_LICENSE==='1'),detail:'نیازمند کلید Pro و مجوز استفاده تجاری.'}],
      limits:['یک پردازش سرور برای SQLite و محدودیت درخواست حافظه‌ای','تماس صوتی/تصویری، پرداخت، هوش مصنوعی ابری و Web Push متصل نیستند','خزانه آنلاین نسخه رمزگذاری‌شده دستی است؛ ادغام زنده ندارد']});
  }catch(error){return jsonError(error)}
}
