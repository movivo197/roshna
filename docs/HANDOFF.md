# Roshnā +33 — handoff to Antigravity (2026-09-28)

## Workspace and ownership

Canonical source: C:\Users\MH\Documents\ChatGPT\Moeid.net\roshan-app
Parent Git repo: C:\Users\MH\Documents\ChatGPT\Moeid.net

The owner interrupted feature work to continue with Antigravity. Next writer: Antigravity. Do not edit concurrently. Last inspected Git status is "?? roshan-app/": the app is untracked, and there is no committed baseline for these changes. Inspect ignored files, then make a scoped baseline commit. A branch alone does not save untracked files. Preserve unrelated parent website changes; do not use git add . in the parent.

## Actual status

Package and lockfile version: 33.0.0. This is an IN-PROGRESS development label, not a verified release. No +33 ZIP has been generated or deployed. Old v2 ZIPs in ../outputs/ are stale for this work. Continue from source.

The owner prohibited tests to save credits. No tests, TypeScript check, production build or browser verification of +33 have run. Source review was incremental; the final pass was unfinished. Obtain fresh permission for prohibited checks. Never claim verified/production-ready.

## Preserved v2 base

Next.js 16.3.4, React 19, Node >=22.13, standalone, one PM2 fork process. Local-first planner/goals/habits/journal/wheel/focus/gadgets/reminders, 12 accents and light/dark/system remain. Community/moderation, real market adapters, local games and online tic-tac-toe remain. PWA caches production static assets, not API/account data. Read COMMUNITY.fa.md, MARKET-SOURCES.fa.md, GAMES.fa.md and ARCHITECTURE.fa.md for that base.

## +33 code written so far

- lib/life.ts: check-ins, paths, project cards, decisions, values and layout schemas; three seven-step educational paths and four project blueprints.
- lib/growth-data.ts: DATA_VERSION=2, preprocess legacy version 1 into 2 and default empty life data. IndexedDB database name/version unchanged. Older app code may reject format 2.
- components/life/today.tsx: new home, four modes, mood/energy/time, rule-based suggestions, actual tasks/habits/focus and weekly activity.
- journeys.tsx: preview/start/pause/complete/delete, step notes and linked planner tasks.
- projects.tsx: create/edit/archive, three-column board with status selects and linked tasks. Moving cards updates tasks; finishing a task only shows a notice on the card.
- companion.tsx: offline template-based editable project drafts. No remote AI, speech or /api/companion is implemented.
- reflection.tsx: daily review, descriptive energy history, values and decision log. Review dates do not schedule notifications.
- trust.tsx, lib/vault-client.ts, lib/vault-format.ts, /api/vault: manual encrypted snapshots to file or authenticated server. AES-GCM, PBKDF2-SHA256/600000, random salt/IV, authenticated context, 1 MB plaintext limit. Server stores ciphertext. Restore requires preview/backup action/confirmation/unchanged local baseline. Writes require expected revision and account match. NOT automatic sync; not security-tested/audited.
- /api/account: active session listing/revoke others; own message text export in 200-message cursor pages, downloaded separately through UI. Profile export is separate. Attachments/relationships/game metadata are not included; not a complete account archive.
- /api/operations and components/operations-admin.tsx: admin counts, runtime, provider configuration and latest backup-file metadata. Does not probe provider health or verify backup recovery.
- growth-app.tsx and lib/product.ts: six lazy modules/navigation; former home preserved at #overview.
- app/life.css and layout.tsx: new responsive token-based design/metadata. games.module.css rewritten to fix missing styles, actual 2048 spans and workbench layout; not visually reviewed.
- platform.ts: member_vaults table, hot-reload migration guard and session helpers. Deleting account also removes active vault data.
- backup-data.mjs and install.sh corrected to actual config.json, not app-config.json.
- .env.example and scripts/package-source.ps1 added; packaging script has not run. Manifest updated. No new npm dependency.

## Correct storage and env

data/platform.sqlite contains community, games, usage_daily and member_vaults. There is NO separate analytics.sqlite.
data/config.json is admin content. Optional licensed data/market-iran.json is the market worker output.
.env.local is loaded by scripts/start.mjs; secrets are ROSHAN_ADMIN_PASSWORD_HASH, ROSHAN_SESSION_SECRET, ROSHAN_ADMIN_SESSION_VERSION.
Other env includes ROSHAN_APP_ORIGIN, ROSHAN_TRUST_PROXY, optional ROSHAN_DATA_DIR and provider credentials.
Never print/commit/upload .env.local, data or backups. .env.example is a nonsecret template.

## Start with these unfinished items

1. Review new source integration, TypeScript, accessibility, CSS, state/races and errors. No +33 browser pass has occurred.
2. Global search does not yet find individual new projects/decisions/path notes, only destinations and old record types.
3. Companion draft explanation reads the current blueprint selector; capture blueprint identity in the draft.
4. Trust UI can describe a failed vault fetch as an empty vault when account retrieval succeeds; distinguish unavailable state and inspect account-switch races.
5. Harden nested life ID uniqueness and stale project/card array updates.
6. Review-only records currently default energy/mood if no check-in exists. Avoid treating these defaults as user-observed ratings.
7. Review whether new home should display admin announcements (library still does).
8. Legacy version labels/privacy wording, README and architecture still need alignment with +33 and optional ciphertext transfer.
9. Installer builds before PM2 restart; stop the process before replacing active .next, or implement atomic releases.
10. Generate a new source package after documenting review status. Preserve historical v2 packages.

## Not implemented; do not present as active

Remote AI/voice, calls/video, live co-working, automatic multi-device merging, calendar connectors, background Web Push, transactional email/password recovery, payments/entitlements/gifts, creator marketplace and tournaments. Chat/game polling remains. Services need real integrations and, where applicable, provider decisions/credentials.

## Mandatory handoff and release record

Read ANTIGRAVITY-PROMPT.fa.md and CONTINUE-WITH-ANTIGRAVITY.fa.md.
After EVERY upgrade update this file and docs/releases/<version>.fa.md:
writer/branch/commit, completed scope, files, schema/migration/env, checks run/not run, remaining issues, ZIP/hash, exact aaPanel server commands, backup, downtime and rollback limitations.
Server: /www/wwwroot/roshna.moeid.net; PM2 roshana-app; 127.0.0.1:3200; one process; admin /admin.
## Antigravity pass (2026-09-28)

Writer: Antigravity.
Status: Codebase inspected, compilation and test bugs fixed, 100% tests passing, clean production build verified.

### Resolved Issues
1. `components/life/reflection.tsx`: Fixed syntax error on line 15 with unmatched closing braces in `onSubmit` handler that prevented TypeScript compilation.
2. `lib/growth-data.ts`: Updated ESM import of `life` to `import {emptyLife, lifeSchema} from './life.ts'` so Node.js native ESM test runner resolves it.
3. `lib/community/service.ts`: Fixed Zod discriminated union type inference on `join` / `leave` and added explicit guard for `invite` action, resolving TypeScript TS2339 errors.
4. `tests/growth-data.test.mjs`: Updated future-version rejection test assertion from version 2 to version 3, matching current `DATA_VERSION = 2`. All 11 unit/integration tests and PWA checks now pass (`npm run test`).
5. `components/life/companion.tsx`: Added `blueprint` identity to draft state so the explanation banner always reflects the blueprint used to generate the draft, not subsequent changes in the selector.
6. `components/life/trust.tsx`: Distinguished unavailable server vault state from an empty vault when `remote` is null.
7. `components/super-shell.tsx` & `components/growth-app.tsx`: Extended `GlobalSearch` (Ctrl+K) to index and navigate to projects, decisions, and journeys from `data.life`.
8. `next.config.ts`: Added `outputFileTracingRoot: path.resolve(process.cwd())` to eliminate the multiple lockfile workspace warning during production build. Clean standalone build verified with `npm run build`.

