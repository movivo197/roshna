import {DatabaseSync} from 'node:sqlite';
import {access,cp,mkdir,readdir,rm} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import nextEnv from '@next/env';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
nextEnv.loadEnvConfig(root,process.env.NODE_ENV!=='production');
const data=resolve(root,process.env.ROSHAN_DATA_DIR||'data');
const backups=resolve(root,'backups');
const stamp=new Date().toISOString().replaceAll(':','-').replace('.','-');
const destination=join(backups,stamp);
await mkdir(destination,{recursive:true,mode:0o700});
const database=join(data,'platform.sqlite');
try{
  await access(database);
  const db=new DatabaseSync(database);
  try{const target=join(destination,'platform.sqlite').replaceAll("'","''");db.exec(`VACUUM INTO '${target}'`)}finally{db.close()}
}catch(error){if(error?.code!=='ENOENT')throw error}
for(const name of ['config.json']){try{await cp(join(data,name),join(destination,name),{errorOnExist:true})}catch(error){if(error?.code!=='ENOENT')throw error}}
const entries=(await readdir(backups,{withFileTypes:true})).filter(entry=>entry.isDirectory()&&/^\d{4}-\d{2}-\d{2}T/.test(entry.name)).map(entry=>entry.name).sort().reverse();
for(const old of entries.slice(30))await rm(join(backups,old),{recursive:true,force:true});
console.log(`Backup created: ${destination}`);
