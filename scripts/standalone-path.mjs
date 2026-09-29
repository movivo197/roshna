import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

/** Next may nest the project when a workspace lockfile sets a parent tracing root. */
export async function findStandaloneDirectory(root) {
  const standalone = path.join(root, '.next', 'standalone');
  async function find(directory) {
    try { await access(path.join(directory, 'server.js')); return [directory]; }
    catch { /* Search only project directories, never dependency packages. */ }
    const result = [];
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isDirectory() && !['node_modules', '.next', 'public'].includes(item.name)) {
        result.push(...await find(path.join(directory, item.name)));
      }
    }
    return result;
  }
  const matches = await find(standalone);
  if (matches.length !== 1) throw new Error('Expected exactly one Next standalone server. Run npm run build first.');
  return matches[0];
}
