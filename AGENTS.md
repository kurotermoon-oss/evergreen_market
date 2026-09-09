# Evergreen Market

Canonical project: `C:/Users/Trap/Desktop/evergreen_market`. Owner: Russian; customer copy: Ukrainian.

## Start and scope
- Run `git status --short`. Read `docs/WORK-STATE.md` only when resuming; use the relevant row of `docs/PROJECT_OVERVIEW.md` when file locations are unknown. Verify against code; these are a map and checkpoint, not a second instruction set.
- Open only the files needed for the current step. Use scoped `rg -n` / `rg --files`, bounded output and batched independent reads. Do not reread unchanged files, whole docs, history, generated bundles or logs without a reason.
- For a broad request, state the outcome and 3–5 sequential stages. Finish one coherent screen/workflow, check it, then continue. Shared foundations come first. Keep the whole requested outcome; do not require owner approval between routine stages.
- Before visual changes state the affected area and direction. Choose one design direction from existing tokens and customer needs. Finish at the acceptance criteria; avoid speculative alternatives and unrelated refactors.
- Preserve user edits and completed work when steered. Ask only when missing input materially changes the result. No subagents unless explicitly requested.
- Update the compact checkpoint after a substantial stage or interruption: done, next, checks, blockers. Replace stale state; do not accumulate a diary or turn a completed brief into standing work.
- Complete the authorized task. End briefly with result, checks and actual limitations. No repeated unchanged progress or large file/log dumps.

## Runtime and verification
- React/Vite/Tailwind v4; Express entry `server/index.cjs` (not `server/app.cjs`); PostgreSQL/Prisma.
- `npm run dev`: real backend + frontend. `npm run preview:design`: read-only preview, port 5180; details in `docs/REDESIGN.md`.
- Frontend code changes: `npm run build` and checks of affected interactions. Docs-only: links, paths and `git diff --check`; no application build or browser matrix.
- Small visual fix: affected screen at narrow and wide widths. Shared layout, navigation or broad redesign: 320/390/768/1280, relevant drawers/dialogs, keyboard and reduced motion. Expand when a failure or shared dependency justifies it.
- Run relevant existing tests for logic changes; no generic `npm test`. Do not add tests that mirror markup. Repeat successful checks only after relevant changes or new evidence.
- No live supplier sync, migrations or real customer writes for design checks. Never expose credentials; preserve data and production behavior. Use existing dependencies; no unrelated upgrades, bulk formatting or paid services.
- Upload only reviewed task files when authorized; verify remote commit. GitHub upload alone does not prove production deployment.

## Business invariants
- Café wholesale goods for neighbors with a small markup. No invented prices, savings, reviews, stock or deadlines.
- Pickup: Kyiv, Білицька, 20, 09:00–21:00. Delivery disabled.
- `in_stock`: one group, no supplier minimum. `supplier_order`: separate supplier groups with their own minima; submit only one group. Preserve guest checkout, sessions, stock validation; Telegram failure must not prevent order creation.
- Supplier filter is optional; categories cover all supplier-order goods. Clear incompatible supplier selection on category change; show supplier + minimum (including no-minimum label). Sort orderable goods first before pagination/related lists.
- Public catalog refresh: every minute while visible and on return; never scrape suppliers on customer page views.
- Milk Diller: Railway Cron every six hours, no in-process interval. Preserve `availabilitySyncEnabled`, immediate check when enabled, manual overrides and `stockStatus` versus merchandising `active`.
- Read `docs/BUSINESS_LOGIC.md` or `docs/SUPPLIER_AVAILABILITY_SYNC.md` only for affected rules.

## Design and model
- Reuse existing styles and components; keep heavy admin modules lazy. Read the code map for ownership.
- Neutral surfaces, muted green, readable text, restrained shadows/motion and meaningful state colors. Use wrapping and `minmax(0,1fr)`; keep actions tappable. Preserve safe-area/stack tokens; never hide content to mask overflow.
- Latest user request governs scope. Completed redesign: `docs/REDESIGN.md`; other references: `docs/README.md`. Archives and prototype briefs are historical, not mandatory prompts.
- Effort recommendation: medium for normal feature/design work, low for small edits, high for difficult diagnosis; xhigh only with a concrete need. `AGENTS.md` cannot set effort, model, billing or caching. Do not change models without a request. Read `docs/MODEL-NOTES.md` only for model/usage questions.
