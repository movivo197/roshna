#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "🚀 [$(date '+%Y-%m-%d %H:%M:%S')] Updating Roshna App from Git..."
git pull origin main
node scripts/configure-domain.mjs 2>/dev/null || true
npm install --no-audit --no-fund
npm run build
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] Roshna updated and running smoothly on port 3200!"
