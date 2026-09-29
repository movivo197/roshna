import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { findStandaloneDirectory } from './standalone-path.mjs';

const root = process.cwd();
const standalone = await findStandaloneDirectory(root);
async function files(directory, prefix = '') {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + item.name;
    if (item.isDirectory()) result.push(...await files(path.join(directory, item.name), relative + '/'));
    else if (item.isFile()) result.push(relative);
  }
  return result;
}
const buildId = (await readFile(path.join(root, '.next', 'BUILD_ID'), 'utf8')).trim();
const version = createHash('sha256').update(buildId).digest('hex').slice(0, 20);
await mkdir(path.join(standalone, '.next'), { recursive: true });
await cp(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), { recursive: true });
await cp(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });
const staticFiles = (await files(path.join(root, '.next', 'static'))).map((file) => '/_next/static/' + file);
const publicFiles = (await files(path.join(root, 'public')))
  .filter((file) => file.startsWith('fonts/') || file.startsWith('icons/') || file === 'manifest.webmanifest')
  .map((file) => '/' + file);
const manifest = JSON.stringify({ version, assets: [...staticFiles, ...publicFiles].sort() });
// Write the production manifest only into the deployable bundle.
await writeFile(path.join(standalone, 'public', 'offline-manifest.json'), manifest);
const worker = await readFile(path.join(root, 'public', 'sw.js'), 'utf8');
// Replace only the constant; the sentinel comparison must remain unchanged.
await writeFile(path.join(standalone, 'public', 'sw.js'), worker.replace('const BUILD_ID = "__ROSHANA_BUILD_ID__";', `const BUILD_ID = "${version}";`));
console.log(`Standalone bundle prepared; offline cache contains ${staticFiles.length + publicFiles.length} assets.`);
