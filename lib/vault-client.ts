import {makeBackup,parseBackup,type GrowthData} from './growth-data';
import {VAULT_MAX_BYTES,vaultEnvelopeSchema,type VaultEnvelope} from './vault-format';

const encoder=new TextEncoder();
const context=encoder.encode('roshana:personal-vault:v1');
function encode(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text)}
function decode(text:string){const raw=atob(text),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}
async function derive(passphrase:string,salt:Uint8Array<ArrayBuffer>){
  if(!globalThis.crypto?.subtle)throw new Error('رمزگذاری به مرورگر جدید و HTTPS نیاز دارد.');
  if(passphrase.length<12||passphrase.length>256)throw new Error('گذرواژه خزانه باید بین ۱۲ تا ۲۵۶ نویسه باشد.');
  const material=await crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptVault(data:GrowthData,passphrase:string):Promise<VaultEnvelope>{
  const plaintext=encoder.encode(makeBackup(data));
  if(plaintext.byteLength>VAULT_MAX_BYTES)throw new Error('حجم خزانه آنلاین از یک مگابایت بیشتر است. از پشتیبان فایل در تنظیمات استفاده کن.');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await derive(passphrase,salt);
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context,tagLength:128},key,plaintext);
  return {version:1,cipher:'AES-GCM',kdf:'PBKDF2-SHA256',iterations:600000,salt:encode(salt),iv:encode(iv),ciphertext:encode(new Uint8Array(encrypted))};
}
export async function decryptVault(value:unknown,passphrase:string):Promise<GrowthData>{
  const envelope=vaultEnvelopeSchema.parse(value),salt=decode(envelope.salt),iv=decode(envelope.iv),ciphertext=decode(envelope.ciphertext);
  if(salt.length!==16||iv.length!==12||ciphertext.length>VAULT_MAX_BYTES+16)throw new Error('ساختار خزانه معتبر نیست.');
  const key=await derive(passphrase,salt);
  let plaintext:ArrayBuffer;
  try{plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:context,tagLength:128},key,ciphertext)}catch{throw new Error('گذرواژه درست نیست یا فایل خزانه آسیب دیده است. اطلاعات فعلی تغییر نکرد.');}
  return parseBackup(new TextDecoder('utf-8',{fatal:true}).decode(plaintext));
}
export function downloadJson(value:unknown,name:string){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
