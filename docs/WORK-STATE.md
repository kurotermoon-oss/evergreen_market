# Evergreen: checkpoint

Updated 11.09.2026. Canonical source: `kurotermoon-oss/evergreen_market`, branch `main`. Use the current device's clone and `DEVICE-WORKFLOW.md`.

- Completed stage: replaced the flattened catalog dropdown with a spacious native dialog, responsive category tiles, direct navigation for categories without children and a content-sized subcategory screen. Added a visible mobile category button. Existing supplier/category selection rules remain.
- Zerniatko: compact fixed help button at bottom left, advice opens only on request in an accessible dialog. Removed the in-flow block and automatic invitation; mobile placement accounts for bottom navigation and product purchase controls.
- Checks: category and assistant dialogs at 320/390/768/1280; no horizontal overflow, category scrolling, subcategory/back navigation, direct coffee selection, Escape, Tab/Shift+Tab, focus return, assistant/cart navigation and spacing above mobile purchase controls. Build and 23 storefront tests passed before final publication; final rerun and deployment verification are in progress.
- Deployment: previous storefront fixes (`018ca222052a9fa9ad31d2b39bf497501f3cbc2a`) were verified live by asset hashes. Current category/assistant stage is ready for GitHub publication and production verification.
- Current owner request: finish/publish this stage, then redesign the customer profile so it feels like a personal account. Inspect `AccountView.jsx` and use the read-only `/preview/account` demo for private UI checks.
- Device workflow: GitHub connector can publish. Local fetch uses OpenSSL/HTTP 1.1, path-scoped safe.directory; sync refuses dirty/ahead workspaces. Do not alter .git ownership (earlier automatic approval review rejected that action).
- Preserved: checkout/session/storage fixes, supplier minima and separate groups, guest checkout, minute catalog refresh, six-hour Railway supplier cron. No real orders/account writes, sync or migrations in design checks.
- Data observations remain separate: 300g Suluguni has 1kg text in the long description; three old MilkDiller 404 mappings need source-backed correction.
