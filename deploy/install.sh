#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'Install Node.js 22.13+ (LTS) and npm using aaPanel Node Project first.'
  exit 1
fi
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("Node.js 22.13+ required"); process.exit(1); }'

node scripts/configure-domain.mjs
npm ci --include=dev --include=optional --no-audit --no-fund
if [[ -f data/platform.sqlite || -f data/config.json ]]; then
  node scripts/backup-data.mjs
fi
if [[ ! -f .env.local ]] || ! grep -q '^ROSHAN_ADMIN_PASSWORD_HASH=' .env.local; then
  node scripts/setup-admin.mjs
else
  printf '%s\n' 'Preserving existing .env.local. Use npm run setup:admin -- --reset only when resetting admin access.'
fi
npm run build
if ! command -v pm2 >/dev/null 2>&1; then
  printf '%s\n' 'Build complete. Install PM2: npm install -g pm2'
  printf '%s\n' 'Then: pm2 startOrRestart ecosystem.config.cjs --update-env && pm2 save'
  exit 0
fi
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
printf '%s\n' 'App started. Configure Nginx and HTTPS as described in START-HERE.fa.md.'
printf '%s\n' 'App: https://roshna.moeid.net | Admin: https://roshna.moeid.net/admin'
