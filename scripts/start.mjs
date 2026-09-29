import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { findStandaloneDirectory } from './standalone-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
// Load .env.local from the project root, not the generated standalone folder.
process.env.NODE_ENV = 'production';
nextEnv.loadEnvConfig(root, false);
process.env.HOSTNAME = process.env.APP_HOST || '127.0.0.1';
process.env.PORT = process.env.PORT || '3200';
// A single canonical data directory survives releases and process restarts.
process.env.ROSHAN_DATA_DIR = path.resolve(root, process.env.ROSHAN_DATA_DIR || 'data');
const server = path.join(await findStandaloneDirectory(root), 'server.js');
try { await access(server); }
catch { throw new Error('Production build is missing. Run npm ci && npm run build first.'); }
await import(pathToFileURL(server).href);
