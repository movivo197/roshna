import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, '.env.local');
const resetting = process.argv.includes('--reset');
const unsupported = process.argv.slice(2).filter((arg) => arg !== '--reset');
if (unsupported.length) { console.error('Usage: node scripts/setup-admin.mjs [--reset]'); process.exit(1); }
let previous = '';
try { previous = await readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (/^\s*ROSHAN_ADMIN_PASSWORD_HASH\s*=/m.test(previous) && !resetting) {
  console.error('Admin is already configured. Use --reset to generate a new password and revoke existing sessions.');
  process.exit(1);
}
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
const values = {
  ROSHAN_ADMIN_PASSWORD_HASH: `scrypt$${salt}$${hash}`,
  ROSHAN_SESSION_SECRET: randomBytes(48).toString('hex'),
  ROSHAN_ADMIN_SESSION_VERSION: randomBytes(16).toString('hex'),
};
const keep = previous.split(/\r?\n/).filter((line) => !/^\s*(?:export\s+)?ROSHAN_(?:ADMIN_PASSWORD_HASH|SESSION_SECRET|ADMIN_SESSION_VERSION)\s*=/.test(line));
// Next's dotenv expansion treats $ specially even in quotes, so escape hash separators.
const envValue = (value) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('$', '\\$')}"`;
const content = `${keep.join('\n').trimEnd()}\n${Object.entries(values).map(([key, value]) => `${key}=${envValue(value)}`).join('\n')}\n`.replace(/^\n/, '');
const temporary = resolve(root, `.env-admin-${randomBytes(8).toString('hex')}.tmp`);
try {
  await writeFile(temporary, content, { mode: 0o600, flag: 'wx' });
  await rename(temporary, file);
} finally { await unlink(temporary).catch(() => {}); }
await mkdir(resolve(root, 'data'), { recursive: true, mode: 0o700 });
console.log('\nروشنا — دسترسی مدیر با موفقیت ساخته شد.');
console.log(`رمز ورود مدیر (همین حالا در جای امن ذخیره کنید):\n\n${password}\n`);
console.log('مسیر ورود: https://roshna.moeid.net/admin');
console.log('پس از تغییر رمز، برنامه را مجدداً راه‌اندازی کنید. فایل .env.local را عمومی یا در مخزن کد منتشر نکنید.');
