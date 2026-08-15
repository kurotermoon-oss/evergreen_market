# Supplier Availability Sync

Evergreen Market synchronizes supplier-order availability from Milk Diller's public HTML catalog. The integration is deliberately lightweight: it uses regular HTTP requests plus Cheerio and does not launch a browser.

## Data Rules

- Only products with `fulfillmentType = supplier_order`, a Milk Diller URL, and `supplierSyncEnabled = true` are checked.
- `В наявності` maps to `stockStatus = preorder`.
- `Очікується надходження` maps to `stockStatus = out_of_stock`.
- Network errors, missing markup, and unknown statuses keep the previous `stockStatus`.
- `supplierStatusOverride` values `available` and `unavailable` override the remote status. `auto` follows Milk Diller.
- Synchronization never changes `active`.
- Order submission already rejects `out_of_stock` products on the server.

## Admin Workflow

1. Open `Адмін-панель → Синхронізація`.
2. Select the Milk Diller supplier and connect the `Milk Diller` adapter.
3. Paste the matching Milk Diller product URL for each supplier-order product.
4. Enable automatic checking per product.
5. Run `Перевірити без змін` first.
6. Review the run summary, then run `Перевірити зараз`.
7. Enable automatic runs only after the mappings are confirmed.

If more than 30% of at least ten mapped products would change at once, the run is recorded as `blocked` and no product statuses are updated. The admin can rerun and force the changes after reviewing them.

## Commands

```bash
npm run test:milkdiller-parser
npm run test:milkdiller-live
npm run sync:milkdiller
```

The live parser check is read-only. The sync command writes to PostgreSQL and requires:

```text
USE_POSTGRES=true
DATABASE_URL=...
```

Do not put real environment values into source control or logs.

## Railway Cron

Create a separate Railway service from the same repository after the web service has deployed the Prisma migration.

Start command:

```text
npm run sync:milkdiller
```

Suggested schedule for four daily runs:

```text
0 5,9,13,16 * * *
```

Railway evaluates cron schedules in UTC. During Kyiv summer time this corresponds to 08:00, 12:00, 16:00, and 19:00. The local time shifts by one hour in winter unless the Railway schedule is adjusted.

The cron service must share the production `DATABASE_URL`, `USE_POSTGRES`, Telegram variables, and optional sync tuning variables. It must exit after each run and should not have a public domain.

## Optional Tuning

- `SUPPLIER_SYNC_USER_AGENT`: custom HTTP user agent.
- `SUPPLIER_SYNC_MASS_CHANGE_RATIO`: mass-change blocking ratio, default `0.3`.
- `MILKDILLER_FETCH_TIMEOUT_MS`: request timeout, default `15000`.
- `MILKDILLER_FETCH_RETRIES`: retries after the first attempt, default `2`.
- `MILKDILLER_FETCH_CONCURRENCY`: catalog page concurrency, default `3`.
- `MILKDILLER_MAX_PAGES`: safety cap, default `40`.

## Failure Behavior

- A concurrent run is rejected while the supplier lock is active.
- A lock expires after 20 minutes if a process terminates unexpectedly.
- Fatal and mass-change-blocked runs are recorded and trigger a best-effort Telegram alert.
- Product-level request errors are stored per product and shown in the admin panel.
- The admin panel shows the latest 30 runs; PostgreSQL retains the full history until a future cleanup policy is added.
