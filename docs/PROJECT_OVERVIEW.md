# Evergreen: code map

Canonical project: `C:/Users/Trap/Desktop/evergreen_market`. Checked 09.09.2026. Use only the row needed; confirm paths before editing. Update a row when ownership changes.

Evergreen connects the café’s wholesale purchases to neighbors buying goods for home pickup. Customer explanation: «Ми закуповуємо товари для кавʼярні напряму у постачальників. Частину цих товарів ви можете замовити для себе і забрати в Evergreen». Keep the experience local, warm, honest and simple; delivery is not active.

## Find the starting point

Paths below are relative to the repository root.

| Task | Start here | Follow only when needed |
| --- | --- | --- |
| Home | `src/views/HomeView.jsx`, `src/components/storefront/HomeIntro.jsx` | `src/components/HeroSection.jsx` |
| How it works | `src/views/HowItWorksView.jsx`, `src/styles/shopping-guide.css` | `docs/UX_COPY.md` |
| Catalog/filtering | `src/views/CatalogView.jsx`, `src/hooks/useCatalogFilters.js` | `src/components/catalog/CatalogSidebar.jsx`, `src/utils/products.js` |
| Product/card | `src/views/ProductDetailsView.jsx`, `src/components/ProductCard.jsx` | `src/components/QuantityControl.jsx` |
| Cart/checkout | `src/views/CartView.jsx`, `src/components/CartDrawer.jsx` | `src/hooks/useCart.js`, `src/hooks/useOrderSubmit.js`, `src/utils/cartSupplierRules.js` |
| Customer account/login | `src/views/AccountView.jsx`, `src/views/CustomerAuthView.jsx` | `src/hooks/useCustomerSession.js` |
| Contacts/confirmation | `src/views/ContactsView.jsx`, `src/views/SuccessView.jsx` | `src/components/Footer.jsx` |
| Header/mobile navigation | `src/components/Header.jsx`, `src/components/MobileNav.jsx` | `src/components/FloatingCartButton.jsx` |
| Dialogs/feedback | `src/components/Modal.jsx`, `src/styles/controls.css` | `src/components/FeedbackButton.jsx`, `src/components/OrderRulesModal.jsx` |
| Mascot/order guidance | `src/components/ShoppingAssistant.jsx`, `src/utils/shoppingAssistant.js` | `src/components/BeanMascot.jsx`, `src/styles/shopping-assistant.css`; selected cart group is passed from `CartView.jsx` through `App.jsx` |
| Admin navigation | `src/views/AdminView.jsx`, `src/styles/admin.css` | `src/hooks/useAdminData.js` |
| Admin section | Matching `src/components/admin/Admin*Panel.jsx` | Orders, Catalog, Customers, Feedback, Security, Suppliers, SupplierSync, Analytics |
| Admin product editor | `src/components/admin/AdminProductEditModal.jsx`, `src/components/admin/AdminProductForm.jsx` | Category, price and image components in the same directory |
| Routing/data wiring | `src/App.jsx`, `src/utils/routes.js`, `src/api/client.js` | `src/hooks/usePublicData.js` |
| SEO/public URLs | `src/utils/pageMeta.js`, `server/seoRoutes.cjs` | `docs/SEO_REQUIREMENTS.md` |
| Backend/supplier/DB | `server/index.cjs`, `server/scripts/`, `prisma/` | Read domain docs first; search symbols instead of opening the whole server |

## Style ownership

`src/index.css` imports, in order: `legacy.css`, `storefront.css`, `controls.css`, `admin.css` from `src/styles/`. Guide styling is in `shopping-guide.css`. Legacy CSS still supports shared behavior; do not remove it wholesale. Public theme uses `.eg-storefront`; shared controls/dialogs belong in `controls.css`. Extend the owning file instead of adding duplicate override systems.

## Preview and checks

Commands are in root `AGENTS.md` / `package.json`. Safe preview and previous QA: `docs/REDESIGN.md`. Preview entry: `scripts/preview-design.mjs`; API guard: `scripts/readonlyPreview.mjs`; regression check: `node --test scripts/preview-safety.test.mjs`.

`src/views/DesignPreview.jsx` exposes `/preview/admin`, `/preview/account`, `/preview/success` only in development + read-only mode. Fake private data; no real order/admin submission. Public snapshots in ignored `.preview/` may be stale. Normal dev uses the real backend.
