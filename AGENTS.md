# Evergreen Market

Source: `https://github.com/kurotermoon-oss/evergreen_market`, `main`; use this device's clone. Owner: Russian; customer copy: Ukrainian.

## Work cycle
- Start with `git status --short` and sync/compare `origin/main` once. `npm run sync` handles clean-main fast-forward; `sync:check` reports differences. Preserve/reconcile local work; no force-push. See `docs/DEVICE-WORKFLOW.md` for setup problems.
- Use instructions already in context. Read `docs/WORK-STATE.md` only on resumption and the relevant `docs/PROJECT_OVERVIEW.md` row only when locations are unknown. Neither requires reading linked docs.
- Small task: state the intended result in one sentence, then act. Broad task: 3–5 coherent stages, completed sequentially. Choose one visual direction using existing styles. Fix the requested behavior and demonstrated bugs in its workflow; defer unrelated improvements.
- Locate with scoped `rg`; read the relevant function/style, not its whole file. Batch independent reads. Reread only changed lines or to resolve a named uncertainty. Keep tool output focused; summarize successful checks, show failure details when needed.
- Preserve work when steered. Ask only for materially missing input. No subagents unless requested. Stop iterating when acceptance criteria and required checks pass.
- Checkpoint: at substantial completion/interruption, replace stale state with done/next/checks/blockers, normally under 250 words. Update other docs only if behavior, contracts or file locations changed; avoid progress-only follow-up commits.
- For authorized publication, fetch again, review/upload only task files, verify remote main and deployment separately. Reuse the established GitHub/deploy path. End with result, checks and actual limitations.

## Verification and tools
- React/Vite/Tailwind v4; Express `server/index.cjs`; PostgreSQL/Prisma. `npm run dev` uses real backend. `npm run preview:design` is read-only, port 5180; private demos: `/preview/account`, `/preview/admin`.
- Frontend: one successful `npm run build` after coherent edits, plus affected interactions. Logic: relevant existing tests, no generic `npm test` or markup-mirroring tests. Docs-only: paths/links and `git diff --check`.
- Local visual fix: narrow and wide affected screen. Screen/shared-layout redesign: 320/390/768/1280; one layout pass, interactions where behavior differs, relevant dialogs/keyboard/reduced motion. Repeat only the check affected by a later change or failure; no whole-site matrix by default.
- Browser: reuse the session and known APIs. Choose one authoritative observation per question: compact AX/DOM for state, screenshot for appearance. Do not duplicate an auto-emitted screenshot. Verify the target tab/viewport before a responsive pass. If input/state observations disagree, inspect one screenshot before retrying or changing code. Do not reset a session just to discover an API.
- Once a check passes, record it briefly and move on. For deployment, use the known release/status signal and one final public verification; avoid tight polling or rechecking identical assets.
- No live supplier sync, migrations or real customer writes for design checks. No credentials, private snapshots or unrelated files in uploads. Existing dependencies only; no unrelated upgrades, bulk formatting or paid services.

## Business and design
- Neighborhood café wholesale goods, small markup; no invented prices, savings, stock, reviews or deadlines. Pickup: Kyiv, Білицька, 20, 09:00–21:00. Delivery disabled.
- `in_stock`: one group, no supplier minimum. `supplier_order`: separate supplier groups/minima; submit one group. Preserve guest checkout, sessions and stock validation. Telegram failure must not prevent order creation.
- Supplier filter optional; categories span all supplier-order goods. Clear incompatible supplier on category change. Show supplier and minimum/no-minimum label. Sort orderable goods before pagination/related lists.
- Catalog defaults to supplier_order. Exclude supplier-order out_of_stock from public API without changing active; admin still lists them. Refresh public catalog each minute while visible/on return; never scrape on page views.
- Milk Diller: Railway Cron every six hours, no in-process interval. Preserve availabilitySyncEnabled, immediate enable check, overrides and stockStatus versus active. Read `docs/BUSINESS_LOGIC.md` / `docs/SUPPLIER_AVAILABILITY_SYNC.md` only for affected rules.
- Reuse components/tokens; heavy admin modules stay lazy. Neutral surfaces, muted green, readable text, restrained motion/shadows. Wrap text, use minmax(0,1fr), tappable actions and safe-area/stack tokens; never hide content to mask overflow.
- Archives/completed briefs are history. Model/effort are actual Codex settings, not controlled by Markdown; do not change without request. Read `docs/MODEL-NOTES.md` only for usage/model questions.
