# Evergreen: checkpoint

Updated 12.09.2026. Source: `kurotermoon-oss/evergreen_market`, `main`; use this device's clone and `DEVICE-WORKFLOW.md`.

- Completed storefront: category/help `7148b62`, profile `12327aa`. Profile has overview/orders/personal data, compact history, filters and explicit history-load errors. Main/AccountView assets matched local SHA-256; public health returned 200/ok. 24 storefront tests, build and responsive/demo interactions passed; no real profile writes.
- Latest remote `5625b5b` preserved: fixes omitted-versus-cleared subcategory and oldPrice in product PATCH. Another task restored 313 lost subcategory relations using matched before/after data, verified other product fields unchanged; 7 new repository regressions, 10 storefront and 13 supplier-sync checks passed. Server deployment verification remains with that task.
- Recovery snapshots/journal stay in the other task's ignored `private-audit/subcategory-repair`; never upload. Deferred/source questions: registration, minima, purchase schedules, syrup labels, caramel Alpro composition and three old MilkDiller URLs.
- Current task: reduce wasted context and repeated work. AGENTS.md now specifies bounded reads, scoped verification, single browser evidence, session reuse and a clear stop condition. MODEL-NOTES.md records observed inefficiencies without promising a savings percentage. Model/effort unchanged.
- Checks for these instruction-only changes: preserved business rules, links/paths and whitespace. No application rebuild or repeat browser matrix needed. Publish only the three instruction/checkpoint files, preserving concurrent remote changes.
- Next: follow the owner's next request after syncing main. Earlier design briefs are complete; no standing redesign backlog.
