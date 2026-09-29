import {z} from 'zod';
import {assertMutation,getDb,HttpError,json,jsonError,rateLimit,readJson,requireMember,transaction} from '@/lib/server/platform';
import {vaultEnvelopeSchema,VAULT_MAX_BYTES} from '@/lib/vault-format';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const bodySchema=z.object({memberId:z.string().min(1).max(128),revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER-1),envelope:vaultEnvelopeSchema.nullable()}).strict();
export async function GET(request:Request){
  try{const member=requireMember(request);rateLimit(request,`vault-read:${member.id}`,30,60000);const row=getDb().prepare('SELECT revision,envelope,updated_at FROM member_vaults WHERE member_id=?').get(member.id);return json({memberId:member.id,revision:row?Number(row.revision):0,envelope:row?.envelope?JSON.parse(String(row.envelope)):null,updatedAt:row?String(row.updated_at):null});}catch(error){return jsonError(error)}
}
export async function POST(request:Request){
  try{
    assertMutation(request);const member=requireMember(request);rateLimit(request,`vault-write:${member.id}`,6,60000);
    const input=bodySchema.parse(await readJson(request,1_400_000));
    if(input.memberId!==member.id)throw new HttpError(409,'حساب فعال تغییر کرده است. صفحه را تازه کن.');
    if(input.envelope){const e=input.envelope;if(Buffer.from(e.salt,'base64').length!==16||Buffer.from(e.iv,'base64').length!==12||Buffer.from(e.ciphertext,'base64').length>VAULT_MAX_BYTES+16)throw new HttpError(400,'اندازه فایل رمزگذاری معتبر نیست.');}
    return transaction(()=>{const db=getDb(),old=db.prepare('SELECT revision FROM member_vaults WHERE member_id=?').get(member.id);if(Number(old?.revision||0)!==input.revision)throw new HttpError(409,'نسخه سرور تغییر کرده است. ابتدا وضعیت تازه را بگیر و نسخه‌ها را بررسی کن.');const revision=input.revision+1,updatedAt=new Date().toISOString();db.prepare('INSERT INTO member_vaults(member_id,revision,envelope,updated_at) VALUES(?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET revision=excluded.revision,envelope=excluded.envelope,updated_at=excluded.updated_at').run(member.id,revision,input.envelope?JSON.stringify(input.envelope):null,updatedAt);return json({memberId:member.id,revision,updatedAt,envelope:input.envelope});});
  }catch(error){return jsonError(error)}
}
