import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (await readFile(path.join(root, 'public', 'sw.js'), 'utf8'))
  .replace('const BUILD_ID = "__ROSHANA_BUILD_ID__";', 'const BUILD_ID = "test-build";');
const assets = ['/_next/static/app.js', '/_next/static/app.css', '/fonts/font.woff2', '/icons/icon-192.png', '/manifest.webmanifest'];
const origin = 'https://roshna.moeid.net';
const canonical = (key) => new URL(typeof key === 'string' ? key : key.url, origin).href;
const storage = new Map();
const listeners = new Map();
let disconnected = false;
let failedAsset = '';
let applied = 0;
const caches = {
  async open(name) {
    if (!storage.has(name)) storage.set(name, new Map());
    const data = storage.get(name);
    return {
      async match(key) { return data.get(canonical(key))?.clone(); },
      async put(key, response) { data.set(canonical(key), response.clone()); },
    };
  },
  async keys() { return [...storage.keys()]; },
  async delete(key) { return storage.delete(key); },
};
const self = {
  location: { origin },
  addEventListener(type, callback) { listeners.set(type, callback); },
  async skipWaiting() { applied++; },
  clients: { async claim() {} },
};
const fetch = async (request) => {
  if (disconnected) throw new TypeError('Offline');
  const url = new URL(canonical(request));
  if (url.pathname === failedAsset) return new Response('Not found', { status: 404 });
  if (url.pathname === '/offline-manifest.json') return Response.json({ version: 'test-build', assets });
  if (url.pathname === '/') return new Response('<html>Offline application</html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response(`Asset: ${url.pathname}`);
};
vm.runInNewContext(source, { self, caches, fetch, Response, URL }, { filename: 'sw.js' });
async function lifecycle(type, extra = {}) {
  let pending;
  listeners.get(type)({ ...extra, waitUntil(promise) { pending = promise; } });
  await pending;
}
async function message(type) {
  let result;
  await lifecycle('message', { data: { type }, ports: [{ postMessage(value) { result = value; } }] });
  return result;
}
function request(url, mode = 'cors', method = 'GET') {
  let response;
  listeners.get('fetch')({ request: { url: new URL(url, origin).href, mode, method }, respondWith(value) { response = value; } });
  return response;
}

await lifecycle('install');
assert.equal(applied, 0, 'Installing must not activate an update automatically');
assert.equal((await message('OFFLINE_STATUS')).ready, true);
assert.equal((await message('OFFLINE_STATUS')).assets, assets.length + 1);
for (const url of ['/admin', '/admin/users', '/api/config', '/api/admin/session']) {
  assert.equal(request(url, 'navigate'), undefined, `${url} must never be cached`);
}
assert.equal(request('/?_rsc=abc'), undefined, 'RSC must pass through untouched');
assert.equal(request('/', 'navigate', 'POST'), undefined, 'POST must never be cached');
assert.equal(request('https://external.example/a.js'), undefined, 'External origins must pass through');
disconnected = true;
assert.match(await (await request('/?view=habits', 'navigate')).text(), /Offline application/);
assert.match(await (await request('/_next/static/app.js')).text(), /Asset:/);
assert.equal(request('/other-page', 'navigate'), undefined, 'Unrelated URLs must not receive an app shell');
const saved = storage.get('roshana-offline-test-build');
saved.delete(canonical('/fonts/font.woff2'));
assert.equal((await message('OFFLINE_STATUS')).ready, false, 'Readiness must detect a missing font');
disconnected = false;
assert.equal((await message('PREPARE_OFFLINE')).ready, true, 'Repair must restore missing offline assets');
await message('APPLY_UPDATE');
assert.equal(applied, 1, 'Explicit user update must activate the waiting worker');
failedAsset = '/_next/static/app.css';
await assert.rejects(lifecycle('install'), /Cannot cache/);
assert.equal((await message('OFFLINE_STATUS')).ready, false, 'Incomplete installs must not be reported ready');
console.log('PWA checks passed: complete precache, offline navigation/static assets, admin/API exclusions, accurate readiness, repair and explicit updates.');
