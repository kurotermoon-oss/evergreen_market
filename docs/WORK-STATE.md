# Evergreen: checkpoint

Updated 19.09.2026. Base: `kurotermoon-oss/evergreen_market`, `main`, `dd54b84`. Existing untracked `docs/CATALOG-QUALITY-PRICING.md` is unrelated and must not be uploaded.

- Telegram admin Mini App is published at `/telegram/admin`: active/history lists, search, filters, order details, confirmed status actions and cancellation. Lazy entry with isolated orders-only API/session. PostgreSQL row locks protect shared website/Telegram order actions. No customer Mini App or catalogue editing added.
- Current update reuses `TELEGRAM_BOT_TOKEN` by default for admin authentication and notifications. Optional nonblank `TELEGRAM_ADMIN_BOT_TOKEN` overrides both. Access still requires explicit `TELEGRAM_ADMIN_USER_IDS`; `TELEGRAM_CHAT_ID` grants no permissions. No extra update consumer is introduced. Setup docs cover shared bot and personal admin menu buttons.
- Previous release: build and 34 tests passed; browser QA at 320/390/768/1280 and status/conflict/expiry flows. GitHub main and Railway deployment verified, public page returned 200 and anonymous orders API 401. Real Telegram sign-in remains unverified.
- Current checks: all 12 Telegram tests passed, including shared-token login/notifications, optional dedicated token, missing credentials/allowlist and rejection of non-admin users. Diff reviewed and whitespace checks passed. Frontend unchanged.
- Next: publish the verified update, check Railway and public access, then configure allowed staff IDs, HTTPS app URL and bot menu per `docs/TELEGRAM_ADMIN.md`. Existing token need not be copied. Check actual Telegram login with authorized and unauthorized accounts. No live messages/orders, supplier runs or migrations performed.
