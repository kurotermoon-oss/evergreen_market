# Supplier Availability Sync

Evergreen Market synchronizes supplier-order availability from Milk Diller's public HTML catalog. The integration is deliberately lightweight: it uses regular HTTP requests plus Cheerio and does not launch a browser. Because Milk Diller has no API or webhooks, the current mode is a periodic check every six hours rather than true real-time updates.

## Data Rules

- Only products with `fulfillmentType = supplier_order`, a Milk Diller URL, and `supplierSyncEnabled = true` are checked.
- `В наявності` maps to `stockStatus = preorder`.
- Waiting for supply (including `Очікується надходження` / `Очікує на постачання`) maps to `stockStatus = out_of_stock`. Public API excludes these supplier-order products; admin records and `active` stay unchanged. Availability returning restores them automatically.
- Network errors, missing markup, and unknown statuses keep the previous `stockStatus`.
- `supplierStatusOverride` values `available` and `unavailable` override the remote status. `auto` follows Milk Diller.
- Synchronization never changes `active`.
- Order submission already rejects `out_of_stock` products on the server.

## Admin Workflow

1. Open `Адмін-панель → Синхронізація`.
2. Select the Milk Diller supplier and connect the `Milk Diller` adapter.
3. Click `Знайти посилання` to preview bulk product matching.
4. Review the exact and normalized matches, then click `Зберегти N`. Existing links are never overwritten.
5. Review the unmatched and ambiguous lists. Add those links manually only after confirming the exact product, volume, and variant on Milk Diller.
6. Enable automatic checking per product if it was not enabled during bulk matching.
7. Run `Перевірити без змін` first.
8. Review the run summary, then run `Перевірити зараз`.
9. Turn on `Автоматична перевірка` only after the mappings are confirmed. Enabling it starts one immediate check; disabling it stops later cron runs from changing product statuses.

Bulk matching writes only unique exact or safely normalized name matches. Similar-name suggestions are informational and are never applied automatically. Products removed from the current Milk Diller catalog, or products with several plausible variants, remain unresolved instead of receiving an unsafe link.

If more than 30% of at least ten mapped products would change at once, the run is recorded as `blocked` and no product statuses are updated. The admin can rerun and force the changes after reviewing them.

## Commands

```bash
node --test server/scripts/testSupplierAvailabilitySync.cjs
npm run test:milkdiller-parser
npm run test:milkdiller-mapping
npm run test:milkdiller-live
npm run test:milkdiller-mapping-live
npm run sync:milkdiller
```

Both live checks are read-only. The mapping live check also reads local products from PostgreSQL. The sync command writes to PostgreSQL and requires:

```text
USE_POSTGRES=true
DATABASE_URL=...
```

Do not put real environment values into source control or logs.

## Railway Cron

Create a separate Railway service from the same repository after the web service has deployed the Prisma migration. Use the service UI settings: Railway currently disallows new Config-as-Code adoption (deprecated), so do not add a cron schedule to the web service or rely on a new railway.json.

- Source: same GitHub repository, main branch, root directory empty.
- Build command: `npx prisma generate` (no storefront build needed).
- Start command: `npm run sync:milkdiller`.
- Schedule: `0 */6 * * *`; restart policy: Never.
- No public domain, volume, healthcheck or pre-deploy migration command.
- Variables: `USE_POSTGRES=true`, `DATABASE_URL=${{Postgres-nEsF.DATABASE_URL}}` via Railway reference. Optional existing Telegram variables can also be references; never copy secrets into Git.
- Deploy once and inspect run logs; verify the admin history contains a cron-triggered run. A service deployment/manual trigger proves job execution, not that the next timed invocation has happened.

Reference: https://docs.railway.com/cron-jobs

Start command:

```text
npm run sync:milkdiller
```

Recommended six-hour schedule:

```text
0 */6 * * *
```

Railway evaluates cron schedules in UTC. A six-hour interval is timezone-independent. The cron service still starts every six hours while the admin switch is off, but it only reads the enabled-supplier list and exits without crawling Milk Diller.

The cron service must share the production `DATABASE_URL`, `USE_POSTGRES`, Telegram variables, and optional sync tuning variables. It must exit after each run and should not have a public domain.

The public storefront refreshes its product list once per minute while the tab is visible, and immediately when a hidden tab becomes visible again. Therefore an already-open storefront reflects a completed supplier check without requiring a manual page reload.

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
- Product-level errors are stored per product. Partial runs use `partial`, all failed products use `failed`, no mappings use `empty`. Dry runs and partial results never advance last successful sync.
- Cron exits nonzero for failed, partial, blocked or empty runs. It prints summary counts without the full product detail list; Never restart avoids rapid retries.
- Permanent HTTP errors such as 404 are not retried. Transient failures retain bounded retries; setting retry count to zero is supported.
- A missing catalog URL can be repaired only by a unique matching supplier product ID. Conflicting/ambiguous IDs and unknown statuses retain previous availability and require mapping review.
- Dashboard shows the latest actual cron run independently of manual history. An enabled switch with no cron history or more than seven hours without a run displays a warning.
- The admin panel shows the latest 30 runs; PostgreSQL retains the full history until a future cleanup policy is added.
