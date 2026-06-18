# AGENTS.md

Purpose: keep future Codex sessions fast and consistent. Read this first, then inspect only the files relevant to the task. Update this file when commands, architecture, env requirements, ports, test strategy, product rules, design rules, or important conventions change.

## Project Snapshot

Evergreen Market is a Vite + React storefront/admin app with an Express backend and PostgreSQL/Prisma persistence.

- Frontend: React ESM under `src/`, Vite, Tailwind CSS v4, `lucide-react`, `recharts`, `react-easy-crop`.
- Backend: Node/Express CommonJS under `server/`.
- Database: Prisma schema and migrations under `prisma/`; local Postgres service in `docker-compose.yml`.
- Main flows: public catalog, cart/order checkout, customer login/account, admin catalog/orders/customers/analytics/feedback/security, Telegram notifications/verification, S3-compatible uploads.
- Business positioning: Evergreen Market is a local neighborhood marketplace connected to the Evergreen coffee shop in Kyiv. The shop already buys products directly from suppliers for café operations, and the marketplace lets nearby customers order part of those products for home use with simple pickup at Evergreen.
- Public storefront/customer-facing copy should be Ukrainian by default. Existing Ukrainian/Russian mixed copy may remain unless the task is explicitly about copy, localization, or public UX. Do not add new Russian text to public customer-facing UI. Some existing strings may display as mojibake in terminals; preserve existing user-facing text unless the task is explicitly about copy or encoding.

## First Moves

- Check `git status --short --branch` before editing.
- Use `rg` / `rg --files` for search.
- Do not read all of `server/index.cjs` unless necessary; it is large. Search within it or prefer route/repository/service files first.
- Never print, copy into answers, or commit `.env` values. `.env` is ignored and may contain real secrets.
- For visual/public page tasks, first identify the existing page/component/style files and state which files you plan to change before coding.
- For `/how-it-works`, first fix layout quality and readability before adding new visuals.

## Business And UX Context

Evergreen Market should feel like a useful local service, not a cold corporate marketplace, complicated B2B platform, supermarket, warehouse, or logistics dashboard.

Core customer explanation:

- Evergreen already buys products for the coffee shop directly from suppliers.
- Customers can order selected products for personal use through the site.
- Pickup currently happens at the Evergreen coffee shop.
- Local delivery near the café/residential buildings is a future idea, not an active promise unless explicitly enabled.
- Supplier minimum orders exist because many suppliers do not process tiny individual purchases. Explain this simply and transparently.

Preferred public wording style:

- Warm, simple, local, honest, and clear.
- Public website text should be Ukrainian.
- Avoid bureaucratic/business-heavy wording such as `B2B-постачальники`, `комерційна модель`, `оптимізація логістики`, `ми є посередником`, `сегмент кошика`, or similar internal terms in customer-facing UI.
- Prefer phrases like `ми закуповуємо товари для кавʼярні напряму у постачальників`, `частину цих товарів ви можете замовити для себе`, `забрати замовлення можна в Evergreen`, and `зайшли за кавою — забрали своє замовлення`.

Desired customer reaction:

> “А, зрозуміло. Це наша кавʼярня поруч, через яку можна замовити товари для дому. Умови пояснені чесно. Можна спробувати.”

## Public Marketing Page Design Role

When working on public-facing marketing pages, especially `/how-it-works`, act as a senior UX/UI designer, product designer, art director, UX writer, and frontend implementer.

Do not only “make cards prettier”. Before coding, think through:

- what the visitor understands in the first 5 seconds;
- what fear or confusion the page must remove;
- what makes the service feel trustworthy;
- whether the page feels local and human;
- whether the page shows real useful products, not only abstract process logic;
- whether the visitor clearly understands pickup and future delivery status;
- whether the page has a clear next action;
- whether visual rhythm feels designed, not just a list of sections.

Evergreen Market public pages should feel like:

- a familiar neighborhood café;
- a simple way to order useful products for home;
- a warm local service;
- a transparent and understandable process;
- a trustworthy pickup experience at Evergreen.

They should not feel like:

- a generic SaaS landing page;
- a logistics dashboard;
- a wholesale supplier portal;
- a large supermarket;
- an admin screen;
- a template filled with equal cards;
- a page about “minimum order” instead of local convenience.

Design direction for public marketing pages:

- warm local coffee shop;
- neighborhood service;
- existing Evergreen greens, mint, cream, beige, warm white and soft borders;
- simple illustrated details;
- product bag, coffee cup, café, nearby home, route/path metaphors;
- strong but friendly typography;
- varied layouts instead of repeated equal cards;
- trust-building copy;
- calm, honest, human tone.

Avoid:

- redesigning the whole website for a page-level visual task;
- changing global color palette, Tailwind config, navbar, catalog, product cards, cart, footer, admin, backend, or business logic unless explicitly requested;
- making the page look like a cold SaaS/logistics dashboard;
- repeated identical card grids;
- excessive dark green blocks;
- pure black aggressive typography when a softer brand tone works better;
- abstract business language;
- bureaucratic copy;
- heavy dependencies for visual effects;
- visual changes that are not scoped to the requested page.

Before making large visual changes:

1. Inspect the current implementation.
2. Identify existing components/styles that can be reused.
3. State which files will be changed.
4. Explain the intended design direction briefly.

After making changes:

1. Run `npm run build`.
2. Summarize changed files.
3. Explain the design decisions.
4. Mention anything that could not be completed.

## `/how-it-works` Design Quality Bar

`/how-it-works` is the key explanatory page for Evergreen Market.

Navigation label: `Як це працює?`

H1: `Як працює Evergreen Market?`

Customer-facing text on this page must be Ukrainian.

The page must work as one clear landing-page story. It must not become a collection of decorative blocks.

The page should communicate one strong idea:

> Evergreen вже закуповує частину товарів напряму для роботи кавʼярні. Тепер ви можете замовити частину цих товарів для дому й забрати їх у кавʼярні поруч.

The page should feel like:

- a local café opening part of its purchases to neighbors;
- useful, honest, simple and close to home;
- a warm neighborhood service;
- a small story from `товари для кавʼярні` to `пакет для дому`.

It must not feel like:

- a SaaS landing page;
- a logistics diagram;
- a wholesale supplier portal;
- a set of random cards;
- documentation with illustrations;
- a page about `мінімальна сума` instead of a page about local convenience.

### Critical Visual Rules

Before adding any new design elements, fix readability and layout quality.

Required:

- no overlapping text;
- no sticky header covering page content;
- no section starting hidden behind the header;
- no content clipped by viewport, sticky header, or floating cart/chat buttons;
- no horizontal overflow on desktop or mobile;
- no crowded cards with text pressed into borders;
- no huge headings that crush the composition;
- no repeated large dark-green blocks;
- no empty oversized vertical gaps;
- no decorative elements that make the page harder to read.

For sticky header issues:

- add proper top padding/margins for page sections;
- use `scroll-margin-top` for anchor targets;
- ensure content is readable when the header is fixed/sticky.

### Copy Direction

Do not make supplier logistics the emotional center of the page.

Bad page center:

> Постачальник → Evergreen → мінімальна сума → маршрут замовлення.

Good page center:

> Кавʼярня вже закуповує ці товари. Ви можете замовити частину для дому й забрати поруч.

Use sharper, more memorable Ukrainian copy:

- `Не склад. Не супермаркет. Кавʼярня поруч.`
- `Товари, які Evergreen вже закуповує для роботи, можуть стати корисними і вдома.`
- `Зайшли за кавою — забрали пакет із товарами.`
- `Без зайвого шуму: обрали, підтвердили, забрали.`
- `Якщо товар у наявності — без мінімуму. Якщо під замовлення — діють умови конкретного постачальника.`

Avoid overusing:

- `маршрут`;
- `логіка`;
- `схема`;
- `постачальник` in every block;
- `мінімальна сума` as the main message.

### First 5 Seconds

In the first screen, the visitor should understand:

1. Evergreen Market is connected to Evergreen café.
2. The café already buys some goods directly for its work.
3. Customers can order some of these goods for home.
4. Pickup is at Evergreen.
5. This is local, simple, and trustworthy.

### Required Page Structure

The page should be simpler and stronger:

1. Hero with one strong human explanation.
2. Provocative concept block.
3. What can be ordered.
4. Two clear order types: in stock vs supplier order.
5. Minimum order explained only after the user understands the value.
6. Pickup story.
7. Trust / transparency.
8. FAQ.
9. Final CTA.

Avoid adding too many separate sections.

### 1. Hero Section

Keep or use title:

`Як працює Evergreen Market?`

Use main text close to:

`Evergreen вже закуповує частину товарів напряму для роботи кавʼярні. Тепер ці товари можна замовити для дому й забрати в Evergreen поруч із домом.`

Supporting text:

`Молоко, кава, чай, сиропи, напої та солодощі — без зайвого шуму: обрали, підтвердили, забрали.`

Hero chips:

- `наявні товари — без мінімуму`
- `під замовлення — за умовами постачальника`
- `самовивіз у Evergreen`

CTA buttons:

- primary: `Перейти до товарів`
- secondary: local anchor to the explanation section.

Hero visual direction:

- Make it a warm illustrated café pickup story, not a cold logistics scheme.
- Show small Evergreen café, product bag, coffee cup, and small home/neighborhood hint.
- A supplier point may appear in the background, but it must not be the main character.
- Do not overload the hero with too many labels.
- Use inline SVG, CSS shapes, lucide icons, and existing assets where possible.
- Do not add external image files or heavy illustration dependencies unless explicitly requested.

### 2. Concept Block

This is the emotional center of the page.

Title:

`Не склад. Не супермаркет. Кавʼярня поруч.`

Text:

`Ми просто відкриваємо частину кавʼярних закупівель для сусідів: зрозумілі товари, чесні умови й самовивіз там, де ви й так берете каву.`

Design:

- wide editorial layout;
- strong but not huge typography;
- lots of breathing room;
- one visual accent, not many decorations;
- should feel premium, memorable, and easy to read.

### 3. Product Categories

Section title:

`Що можна замовити?`

Text:

`Це реальні товари, з якими кавʼярня працює щодня.`

Categories:

- `Молоко та вершки`
- `Рослинне молоко`
- `Кава`
- `Чай`
- `Сиропи та топінги`
- `Напої`
- `Солодощі та снеки`

Design:

- compact category cards;
- not a long horizontal strip that becomes hard to scan;
- avoid overlap;
- readable on mobile;
- use icons only if they help.

Purpose:

This section makes the service concrete. Without it, the page feels abstract.

### 4. Two Product Paths

This section is more important than abstract route diagrams.

Title:

`Два типи товарів — два різні шляхи`

Block 1:

`Є в наявності`

Text:

`Такі товари можна забрати швидше. Для них не потрібна мінімальна сума постачальника.`

Block 2:

`Під замовлення`

Text:

`Такі товари ми додаємо до закупівлі конкретного постачальника. Для них може діяти мінімальна сума саме цього постачальника.`

Design:

- two clear cards;
- show the difference instantly;
- this should be one of the clearest UX blocks on the page.

### 5. Minimum Order

Do not make minimum order the center of the page.

Title:

`Чому іноді є мінімальна сума?`

Text:

`Деякі постачальники не приймають зовсім маленькі окремі замовлення. Тому для товарів під замовлення може бути мінімальна сума. Вона стосується конкретного постачальника, а не всього сайту.`

Optional note:

`Наявні товари можна замовляти окремо — без такого мінімуму.`

Design:

- simple visual explanation;
- no complicated progress bars unless they are already part of real cart logic;
- no fake supplier progress if the data is not real;
- avoid misleading visuals;
- do not imply different suppliers can be mixed into one minimum if business logic does not allow it.

### 6. Order Process

Title:

`Від каталогу до пакета в кавʼярні`

Steps:

1. `Обираєте` — `Додаєте до кошика потрібні товари.`
2. `Підтверджуємо` — `Ми звʼязуємося з вами й уточнюємо деталі.`
3. `Готуємо` — `Наявні товари відкладаємо, товари під замовлення додаємо до закупівлі.`
4. `Забираєте` — `Зайшли за кавою — забрали пакет із товарами.`

Design:

- do not make the cards huge;
- use a clean route/timeline;
- no overlapping numbers/icons;
- mobile vertical layout.

### 7. Pickup Section

Title:

`Забрати можна в Evergreen`

Text:

`Коли замовлення буде готове, ми повідомимо вас. Забрати його можна в кавʼярні — так само просто, як зайти за кавою.`

Highlight:

`Зайшли за кавою — забрали своє замовлення.`

Delivery note:

`Доставка поки не активна. Зараз головний формат — самовивіз у Evergreen.`

Design:

- warm and local;
- this block should feel human, not administrative.

### 8. Trust Section

Title:

`Щоб усе було зрозуміло`

Use a compact checklist, not another heavy grid.

Items:

- `Пояснюємо умови до замовлення.`
- `Не змішуємо різних постачальників в один мінімум.`
- `Повідомляємо, коли замовлення можна забрати.`
- `Доставку не обіцяємо, поки вона не працює.`
- `Самовивіз — у знайомій кавʼярні Evergreen.`

Purpose:

Reduce anxiety and make the service feel honest.

### 9. FAQ

FAQ should feel like the natural end of the story, not a separate admin block.

Possible questions:

- `Чи можна замовити один товар?`
- `Чому є мінімальна сума?`
- `Чи можна змішувати товари різних постачальників?`
- `Коли я зможу забрати замовлення?`
- `Де забирати?`
- `Чи є доставка?`

Keep answers short, honest, and clear.

### 10. Final CTA

Title:

`Спробуйте замовити товари поруч із домом`

Text:

`Почніть із простого: відкрийте каталог, оберіть потрібні товари, а ми підкажемо, як зручно забрати замовлення в Evergreen.`

Button:

`Перейти до товарів`

Design:

- warm;
- confident;
- visually connected to hero;
- not aggressive.

### Typography And Rhythm For `/how-it-works`

Only adjust typography inside this page unless explicitly requested otherwise.

- Avoid pure black if the current page looks too heavy.
- Prefer existing dark green / brand dark tone for headings.
- Improve paragraph line-height.
- Do not make every heading huge.
- Create hierarchy: hero title > section titles > card titles > supporting text.
- Use varied section types: hero scene, editorial concept block, category cards, two product paths, minimum explanation, pickup story block, trust checklist, FAQ, CTA.
- The page should feel like a guided story, not a list of unrelated blocks.

### Mobile And Accessibility

- Mobile-first.
- Hero visual should stack cleanly.
- Category cards must remain readable.
- Timeline/process should become vertical.
- CTA buttons must not overflow.
- Fixed cart/chat/mobile controls must not overlap content.
- Spacing should feel intentional on small screens.
- Keep contrast readable.
- Use semantic headings.
- Use accessible button/link states.
- Add focus states where needed.
- If animation is added, support reduced motion.
- Do not rely only on color to communicate meaning.

### `/how-it-works` Quality Checklist

Before finishing, check:

- Does the first screen explain the service in 5 seconds?
- Is there one strong idea, not many weak ones?
- Does the page feel like Evergreen café, not a SaaS/logistics page?
- Is the text readable without overlap?
- Is the sticky header not covering content?
- Are headings strong but not oppressive?
- Are product categories concrete and easy to scan?
- Is the difference between in-stock and supplier-order products clear?
- Is minimum order explained honestly?
- Is delivery clearly marked as not active?
- Is the final CTA visible and natural?
- Does mobile layout work without horizontal overflow?

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
- Public routing is URL-based. Key storefront routes are `/`, `/catalog`, `/contacts`, `/cart`, `/checkout`, and the explanatory page `/how-it-works`; product details use `/products/:id`. Keep route changes in sync with `src/utils/routes.js`, page meta in `src/utils/pageMeta.js`, and backend sitemap output in `server/seoRoutes.cjs`.
- `server/seoRoutes.cjs` serves `/sitemap.xml` and `/robots.txt`. Set `SITE_URL` or `PUBLIC_SITE_URL` in production when the deployed canonical origin cannot be derived from request headers or Railway variables.
- `prisma/schema.prisma` is the source of truth for relational models. When schema changes, add a migration and update repository mappers plus frontend payload/default handling together.
- Cart checkout is segmented: all `in_stock` items form one orderable group with no supplier minimum; each `supplier_order` supplier forms its own orderable group and must meet that supplier's `minOrderAmount`. The UI may keep mixed groups in one cart, but order submission must send only one segment.
- Checkout delivery is temporarily disabled in the UI with `DELIVERY_ORDERS_ENABLED` in `src/views/CartView.jsx`. Keep orders as pickup until the business is ready to re-enable delivery; customer registration/profile address fields can remain for future use. Public copy may mention delivery only as a future plan, not as an available service.
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
- `docs/` when present: durable product/business/design specifications for Codex. Read relevant docs before implementing larger UX/business features.
- `docs/HOW_IT_WORKS_REDESIGN_BRIEF.md` when present: detailed design brief for `/how-it-works`. Read it before redesigning or refining this page. If it is not present, use this `AGENTS.md` page contract as the source of truth.

## Coding Conventions

- Keep frontend files as ESM (`import`/`export`) and backend files as CommonJS (`require`/`module.exports`).
- Follow existing hook/component boundaries. Put cross-view state in hooks; keep view components focused on layout/workflow.
- Use `src/api/client.js` for frontend HTTP rather than ad hoc `fetch` calls.
- For admin/product changes, update the chain consistently: defaults -> form/editor -> API payload -> server validation/repository mapper -> Prisma schema/migration when needed.
- For order/customer/security changes, check both Postgres and JSON fallback branches if the touched code supports both.
- Prefer existing utilities in `src/utils/` and `server/utils/` over new one-off parsing.
- Keep UI changes mobile-aware. Verify fixed bottom navigation, cart drawer, modals, and long text wrapping on small screens.
- For public storefront UX, write customer-facing copy in Ukrainian unless the task explicitly asks otherwise.
- When explaining supplier minimums, pickup, or future delivery in UI, use simple customer language rather than internal business terminology.
- Existing design uses Tailwind utility classes plus `eg-*` CSS helpers. Avoid broad visual rewrites unless requested.
- Evergreen visual tone should remain soft, local, and natural: muted greens, beige/off-white surfaces, readable dark text, comfortable spacing, rounded cards where consistent with the existing UI, and no aggressive/neon colors.
- For page-specific marketing design, page-scoped CSS/classes/components are allowed, but do not mutate global theme/colors just to improve one page.
- Use `lucide-react` icons when adding icon buttons.
- Fixed bottom UI must use shared layout tokens in `src/index.css` (`eg-floating-cart`, `eg-floating-feedback`, `eg-product-floating-actions`, `eg-mobile-nav`) so cart, chat, product CTA, safe-area, and mobile nav layers do not overlap. Product CTA stays centered and fixed on mobile and desktop. On `768-1023px`, cart and feedback float as a vertical right-side stack; on wide desktop they can sit horizontally. Modal/drawer overlays such as `CartDrawer` must stay above these floating controls.
- Do not bulk format the repo. Formatting is inconsistent in places; keep edits scoped.

## Design Reference Guidance

When improving public marketing pages, the project may use selected external UI references for inspiration:

- shadcn/ui: https://github.com/shadcn-ui/ui
- Magic UI: https://github.com/magicuidesign/magicui
- HyperUI: https://github.com/markmead/hyperui

These references are allowed as design inspiration, not as full-page templates to blindly copy.

Rules:

- Do not blindly copy full pages from external repositories.
- Do not import or replace the whole design system unless explicitly requested.
- Prefer adapting small patterns, layout ideas, animation ideas, or component structure.
- Before adding any new dependency, explain why it is needed and what files will change.
- Avoid heavy dependencies for decorative effects.
- If an effect can be built with Tailwind/CSS/SVG and existing dependencies, prefer that.
- Keep the Evergreen identity: soft green, beige, warm, local, trustworthy.
- Avoid SaaS/corporate aesthetics that feel too cold, too technological, or unrelated to a neighborhood coffee shop.
- Public-facing pages should feel like a neighborhood coffee shop marketplace, not an admin dashboard.

For landing pages, prefer:

- one clear idea;
- editorial composition;
- compact illustrated explanations;
- route/timeline storytelling only when it clarifies the user journey;
- soft illustrations or simple SVG elements;
- subtle background patterns;
- clear CTAs;
- calm animation and gentle transitions;
- strong but friendly typography;
- varied section rhythm instead of repeated equal grids.

Avoid:

- adding more blocks when the page already feels heavy;
- repetitive equal-size card grids;
- excessive shadows;
- too much dark green in large blocks;
- generic SaaS hero sections;
- overly technical visual language;
- huge empty vertical sections without visual purpose;
- aggressive black typography where it makes the page feel heavy;
- fake dashboards, fake progress bars, or fake supplier data that are not connected to real business logic.

## Verification Guidance

- For most changes: run `npm run build`.
- For backend/data changes: also run the relevant Node smoke script or hit the changed endpoint through the dev server.
- For Prisma/schema changes: run `npm run db:generate`; run migrations only when the task requires database mutation.
- For meaningful frontend changes: run `npm run dev`, open the local Vite app, and inspect affected desktop/mobile views.
- For public marketing page changes: verify desktop and mobile layouts, CTA visibility, fixed cart/chat controls, heading hierarchy, long Ukrainian copy wrapping, sticky header interaction, no overlaps, no horizontal overflow, and reduced-motion behavior if animations were added.

## Git And Safety

- The worktree may contain user changes. Do not revert unrelated edits.
- Do not delete generated data/backups/logs unless explicitly asked.
- Do not expose secrets from `.env`, Telegram, database, JWT, or S3 settings in final answers.
- If a task reveals a new durable convention, command, port, env var, risk, UX rule, or product rule, update this file in the same change.
