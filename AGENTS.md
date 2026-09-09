# Evergreen Market

Read this file first. Keep it concise; open linked references only for the task at hand. Communicate with the owner in Russian; customer-facing copy is Ukrainian.

## Project and commands
- Working project: `C:/Users/Trap/Desktop/evergreen_market`.
- Vite + React + Tailwind v4 frontend in `src/`; CommonJS Express entry point `server/index.cjs`; PostgreSQL/Prisma in `prisma/`. `server/app.cjs` is not the runtime entry point.
- `npm run dev`: local backend (3001) and Vite. `npm run dev:client`: frontend only. `npm run build`: required frontend check. Use installed dependencies and lockfile.
- `npm run preview:design`: read-only local design preview at port 5180. Public catalog snapshots only; API mutations are blocked. See `docs/REDESIGN.md` for setup. Ordinary `npm run dev` keeps the real backend.
- No generic `npm test`. Run relevant existing scripts for backend/parser changes; do not run live sync or DB migrations for a design task.

## Scope, economy and safety
- Start with `git status --short`. Search with `rg`; read relevant files instead of whole repositories, logs, generated bundles or server entry points.
- Complete authorized work, make routine reversible decisions, preserve ongoing work when steered. Ask only for information that materially changes the result.
- Batch independent reads. No subagents unless explicitly requested. After successful relevant checks, repeat only for new changes or new failures. Avoid tests that merely repeat markup.
- Never expose `.env` or credentials. Preserve user edits, data, logs, backups and production behavior. Do not bulk-format or upgrade dependencies without task need.
- `AGENTS.md` does not change model, effort or billing. For Astra-specific guidance read `docs/MODEL-NOTES.md`; default suggestion is low for small edits, medium for features, high for hard diagnosis. These are heuristics, not measured savings.
- Current design request (09.09.2026): improve all existing public and admin UI, responsiveness and push the completed work to GitHub. The earlier storefront/guide work was uploaded as `ab9d867`. Current scope and acceptance criteria: `docs/INTERFACE-BRIEF.md`.

## Business contract
- Café wholesale purchases offered to neighbors with a small markup; no invented savings, prices, reviews, stock or deadlines.
- Pickup: Kyiv, Білицька, 20, 09:00–21:00. Delivery currently disabled; do not promise it.
- `in_stock` products form one orderable group without supplier minimum. `supplier_order` products form separate groups by supplier; each must meet its own minimum. Submission contains only one group. Do not merge groups to meet a minimum.
- Guest orders remain supported. Preserve customer/admin sessions, stock checks and order validation. Telegram notification failure must not prevent order creation.
- Milk Diller sync runs as a short-lived Railway Cron every six hours, never an in-process interval. The admin automatic-check switch controls `availabilitySyncEnabled` and triggers an immediate check when enabled. Preserve manual overrides and the separation between `stockStatus` and merchandising `active`.
- Public products refresh once per minute while the page is visible and on visibility return; customer page views must never scrape a supplier directly.
- Supplier selection is an optional catalog filter. Category navigation covers all supplier-order products; clear an incompatible supplier filter when changing category. Always show the supplier and its minimum on supplier-order cards and details, including an explicit no-minimum label.
- Orderable products precede unavailable products before catalog pagination and in related-product carousels.
- Details: `docs/BUSINESS_LOGIC.md`; supplier parser rules: `docs/SUPPLIER_AVAILABILITY_SYNC.md`.

## Architecture and design
- `src/App.jsx`: route/state wiring; `src/utils/routes.js`: URLs; `src/utils/pageMeta.js`: metadata. Public route changes may also require `server/seoRoutes.cjs`.
- `src/views/`: screens. `src/components/storefront/`: public page components. `src/hooks/`: state/workflows. `src/api/client.js`: frontend requests. Reuse existing utilities.
- Admin view and product editor are lazy-loaded. Keep heavy admin dependencies outside the initial public bundle.
- `src/index.css`: style imports. `src/styles/legacy.css`: preserved shared controls, overlays and admin behavior. `src/styles/storefront.css`: calm public theme scoped to `.eg-storefront`; `shopping-guide.css`: guide styling; `controls.css`: shared controls and modal styling; `admin.css`: separate admin workspace. Do not append duplicate style systems to the entry file.
- Use readable text, neutral surfaces, muted green, restrained shadows, clear actions and subtle motion. Avoid continuous glow, decorative gradients and heavy visual effects. Preserve meaningful availability/error colors.
- Mobile grids use `minmax(0,1fr)`; allow long names/prices to wrap. Keep quantity controls and actions tappable. Test 320/390/768/1280 widths, sticky header, navigation, drawer, cart and reduced motion for substantial public UX changes.
- Fixed UI uses existing `--eg-*` safe-area/stack tokens. Do not fix overflow by hiding content or raising every z-index.
- New brief: `docs/REDESIGN.md`. Historical page brief: `docs/HOW_IT_WORKS_REDESIGN_BRIEF.md`. Owner's current whole-site redesign request supersedes the old page-only restriction.
- Before visual edits name affected files and intended direction. Finish with the result, checks and remaining limitations.

## On-demand references
- `docs/README.md`: documentation map.
- `docs/PROJECT_OVERVIEW.md`, `docs/SEO_REQUIREMENTS.md`, `docs/UX_COPY.md`: domain-specific context.
- `docs/archive/AGENTS-before-2026-09-07.md`: preserved original instructions for historical detail; not a second mandatory prompt. Current user instructions and this root file govern new work within system constraints.
