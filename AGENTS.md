# AGENTS.md

Purpose: keep future Codex sessions fast and consistent. Read this first, then inspect only the files relevant to the task. Update this file when commands, architecture, env requirements, ports, test strategy, or important conventions change.

## Project Snapshot

Evergreen Market is a Vite + React storefront/admin app with an Express backend and PostgreSQL/Prisma persistence.

- Frontend: React ESM under `src/`, Vite, Tailwind CSS v4, `lucide-react`, `recharts`, `react-easy-crop`.
- Backend: Node/Express CommonJS under `server/`.
- Database: Prisma schema and migrations under `prisma/`; local Postgres service in `docker-compose.yml`.
- Main flows: public catalog, cart/order checkout, customer login/account, admin catalog/orders/customers/analytics/feedback/security, Telegram notifications/verification, S3-compatible uploads.
- UI copy is Ukrainian/Russian-facing. Some existing strings may display as mojibake in terminals; preserve existing user-facing text unless the task is explicitly about copy or encoding.

## First Moves

- Check `git status --short --branch` before editing.
- Use `rg` / `rg --files` for search.
- Do not read all of `server/index.cjs` unless necessary; it is large. Search within it or prefer route/repository/service files first.
- Never print, copy into answers, or commit `.env` values. `.env` is ignored and may contain real secrets.

## Commands

- Install deps: `npm install`
- Full dev stack: `npm run dev`
  - Starts backend on `PORT` or `3001`.
  - Starts Vite on its default dev port, with `/api` and `/uploads` proxied to `http://localhost:3001`.
- Frontend only: `npm run dev:client`
- Backend only: `npm run server`
- Production build check: `npm run build`
- Preview built frontend: `npm run preview`
- Prisma generate: `npm run db:generate`
- Prisma dev migration: `npm run db:migrate`
- Prisma deploy migrations: `npm run db:deploy`
- Prisma Studio: `npm run db:studio`
- Local Postgres: `docker compose up -d postgres`

There is no configured `npm test` script. Use `npm run build` as the baseline verification, plus targeted scripts when relevant:

- `node server/scripts/testPrismaConnection.cjs`
- `node server/scripts/testOrdersRepository.cjs`
- `node server/scripts/testCustomersRepository.cjs`

These scripts require a valid database environment.

## Runtime And Data

- `USE_POSTGRES=true` routes most live data through Prisma repositories.
- JSON fallback exists in `server/db.cjs` and writes to `server/data/db.json` (ignored).
- `src/api/client.js` uses same-origin requests with `credentials: "include"`.
- Admin and customer sessions are cookie/JWT based.
- `server/index.cjs` serves `dist/` as static files when the build directory exists.
- `prisma/schema.prisma` is the source of truth for relational models. When schema changes, add a migration and update repository mappers plus frontend payload/default handling together.
- Cart checkout is segmented: all `in_stock` items form one orderable group with no supplier minimum; each `supplier_order` supplier forms its own orderable group and must meet that supplier's `minOrderAmount`. The UI may keep mixed groups in one cart, but order submission must send only one segment.
- Telegram notifications are best-effort. Order creation must not fail just because Telegram `fetch` fails or Telegram API returns an error.

## Important File Map

- `src/App.jsx`: central view state and wiring between hooks/views/components.
- `src/views/`: top-level screens (`HomeView`, `CatalogView`, `CartView`, `AdminView`, auth/account/success/product details).
- `src/components/`: shared UI; admin-specific UI lives in `src/components/admin/`.
- `src/hooks/`: app state and workflow hooks (`useCart`, `useCatalogFilters`, `usePublicData`, `useAdminData`, `useCustomerSession`, `useOrderSubmit`).
- `src/api/client.js`: all frontend API calls.
- `src/data/defaults.js`: form/product defaults and pagination constants.
- `src/utils/`: frontend parsing/formatting/business helpers.
- `src/index.css`: Tailwind import plus Evergreen motion/components (`eg-*` classes).
- `server/index.cjs`: actual `npm run server` entrypoint; includes legacy inline routes and mounts some route modules.
- `server/app.cjs`: smaller route-mounted Express app, but not used by `npm run server`; verify before changing it.
- `server/routes/`: modular Express routes.
- `server/repositories/`: Prisma-backed data access and mappers.
- `server/services/`: domain helpers for products/categories/orders/Telegram.
- `server/middleware/adminAuth.cjs`, `server/runtimeSecurity.cjs`, `server/httpSecurity.cjs`: auth/security/cookie/rate-limit behavior.
- `server/storage/s3Client.cjs`, `server/repositories/uploadsRepository.cjs`, `server/routes/uploads.routes.cjs`: upload path.
- `server/orderWorkflow.cjs`, `server/orderSecurity.cjs`, `server/orderMessage.cjs`: order state, validation, and messages.

## Coding Conventions

- Keep frontend files as ESM (`import`/`export`) and backend files as CommonJS (`require`/`module.exports`).
- Follow existing hook/component boundaries. Put cross-view state in hooks; keep view components focused on layout/workflow.
- Use `src/api/client.js` for frontend HTTP rather than ad hoc `fetch` calls.
- For admin/product changes, update the chain consistently: defaults -> form/editor -> API payload -> server validation/repository mapper -> Prisma schema/migration when needed.
- For order/customer/security changes, check both Postgres and JSON fallback branches if the touched code supports both.
- Prefer existing utilities in `src/utils/` and `server/utils/` over new one-off parsing.
- Keep UI changes mobile-aware. Verify fixed bottom navigation, cart drawer, modals, and long text wrapping on small screens.
- Existing design uses Tailwind utility classes plus `eg-*` CSS helpers. Avoid broad visual rewrites unless requested.
- Use `lucide-react` icons when adding icon buttons.
- Fixed bottom UI must use shared layout tokens in `src/index.css` (`eg-floating-cart`, `eg-floating-feedback`, `eg-product-floating-actions`, `eg-mobile-nav`) so cart, chat, product CTA, safe-area, and mobile nav layers do not overlap. Product CTA stays centered and fixed on mobile and desktop. On `768-1023px`, cart and feedback float as a vertical right-side stack; on wide desktop they can sit horizontally. Modal/drawer overlays such as `CartDrawer` must stay above these floating controls.
- Do not bulk format the repo. Formatting is inconsistent in places; keep edits scoped.

## Verification Guidance

- For most changes: run `npm run build`.
- For backend/data changes: also run the relevant Node smoke script or hit the changed endpoint through the dev server.
- For Prisma/schema changes: run `npm run db:generate`; run migrations only when the task requires database mutation.
- For meaningful frontend changes: run `npm run dev`, open the local Vite app, and inspect affected desktop/mobile views.

## Git And Safety

- The worktree may contain user changes. Do not revert unrelated edits.
- Do not delete generated data/backups/logs unless explicitly asked.
- Do not expose secrets from `.env`, Telegram, database, JWT, or S3 settings in final answers.
- If a task reveals a new durable convention, command, port, env var, or risk, update this file in the same change.
