import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, '.env.local');
let content = '';
try { content = await readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const lines = content.split(/\r?\n/).filter(line => !/^\s*(?:export\s+)?(?:ROSHAN_APP_ORIGIN|ROSHAN_TRUST_PROXY)\s*=/.test(line));
lines.push('ROSHAN_APP_ORIGIN=https://roshna.moeid.net', 'ROSHAN_TRUST_PROXY=1');
if (!/^\s*PORT\s*=/m.test(content)) lines.push('PORT=3200');
const temporary = resolve(root, `.env-domain-${randomBytes(8).toString('hex')}.tmp`);
await writeFile(temporary, lines.join('\n').trim() + '\n', { mode: 0o600, flag: 'wx' });
await rename(temporary, file);
console.log('Domain configured: https://roshna.moeid.net (Nginx proxy required).');
