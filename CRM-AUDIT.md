# Jagtap Tours And Travels CRM audit

> Historical report from before the fixes. See [FIXES-VERIFIED.md](FIXES-VERIFIED.md) for the completed changes, passing checks and remaining hosting verification.

Reviewed 12 September 2026. **At the time of this audit, the project was not ready for public hosting.**

This review covers the first-party frontend components, backend routes, both persistence implementations, SQL schema, configuration, package manifests/lockfiles, and deployment documentation. It identifies **24 bugs/workflow issues and 5 deployment-readiness gaps**. No application-source fixes or deployment were made.

## Verification and limits

- Production Vite build passed: 1,584 modules; generated JavaScript approximately 305 kB (73 kB gzip).
- All 9 first-party backend JavaScript files passed Node syntax checks.
- 15 isolated reproduction groups passed, meaning the listed defective behaviors were reproduced. These are audit assertions, not a passing product test suite.
- HTTP checks used real Express routers on a temporary loopback server and an in-memory store. SQL checks captured statements/parameters; no live PostgreSQL database was used.
- React form logic was exercised with a small hook harness; print content was checked using React static rendering. A complete browser end-to-end test, printed PDF pagination check and real mobile-device QA were not performed.
- npm audit was run against both lockfiles. No dependency updates were applied.
- The CRM data file's SHA-256 matched before/after the reproduction suite.
- Audit artifacts: [checks.cjs](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/.audit/checks.cjs>), [results.json](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/.audit/results.json>). Production build output is in the separate .audit-build directory.

## Prioritized findings

### 1. Critical: Unprotected API exposes every CRM module

Customers, drivers, invoices, quotations and meter readings are mounted without authentication or authorization middleware. Isolated HTTP checks returned 200 for anonymous customer reads and 201 for anonymous creation; the delete/update routes are equally unprotected.

Source: [server/index.js:22](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/index.js:22>).

Fix direction: Require a verified session on every protected endpoint and enforce permissions on the server.

### 2. Critical: Login is a demo bypass, not real authentication

Any nonempty email with admin123 succeeds. The returned token is a constant, /me always returns the administrator, and no user-table lookup or password hashing is performed. LoginForm also signs in locally after a network/JSON error, and App trusts a saved browser user object.

Source: [server/routes/auth.js:12](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/routes/auth.js:12>).

Fix direction: Implement real user accounts, password hashing, expiring sessions, server logout, and login throttling; remove demo/offline login before public exposure.

### 3. High: Invoice, quotation and duty-slip numbers repeat

All three counters use the length of db.json arrays. PostgreSQL inserts never advance those arrays: two inserts produced JTT-2026-003 twice, QTN-2026-103 twice, and DS-2026-004 twice in captured SQL. The schema's unique constraints will reject duplicates. Local deletion also reproduced a duplicate JTT-2026-002. The year is hardcoded to 2026.

Source: [server/data/store.js:470](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:470>).

Fix direction: Use persistent, atomic sequences independent of array length, with unique constraints and an explicit numbering-year policy.

### 4. High: Changing driver status fails in PostgreSQL mode

DriverTable sends {...driver, status}; PostgreSQL rows contain license_number and vehicle_assigned, while updateDriver reads licenseNumber and vehicleAssigned. The captured update had an undefined required license parameter; PostgreSQL will reject it under the NOT NULL constraint.

Source: [server/data/store.js:432](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:432>).

Fix direction: Normalize API records and implement a status-only update endpoint, or consistently map fields before the full update.

### 5. High: Walk-in bills and quotations fail with PostgreSQL

Optional customerId/driverId defaults are empty strings in forms. Bill and quotation inserts pass them directly into INTEGER foreign keys. Empty optional date inputs are also sent as empty strings to DATE columns. These values were confirmed in captured SQL. JSON storage accepts the same submissions, hiding the problem locally.

Source: [server/data/store.js:480](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:480>).

Fix direction: Validate payloads, translate optional empty IDs/dates to null, and require valid dates where the schema requires them.

### 6. High: PostgreSQL dates do not fit the edit form

The installed pg DATE parser produces JavaScript Dates. A 2026-09-12 date serialized on this machine as 2026-09-11T18:30:00.000Z; that timestamp is copied directly into input type=date, which expects YYYY-MM-DD. Bill slip-prefill has the same problem. New-form defaults also use UTC dates, giving the previous local day before 05:30 IST.

Source: [client/src/components/meterReadings/MeterReadingModal.jsx:49](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/meterReadings/MeterReadingModal.jsx:49>).

Fix direction: Normalize database DATE values to date-only strings without timezone shifts and use local business dates for form defaults.

### 7. High: Storage changes silently and health status can be misleading

PostgreSQL is tested only once, after the HTTP server starts. Early requests can write JSON before PostgreSQL is selected. A failed startup probe leaves the process on JSON until restart, and no JSON-to-PostgreSQL migration exists. After a successful probe, pool errors do not reset the connected flag. Health always returns 200 and tests neither schema availability nor ongoing query success.

Source: [server/config/db.js:33](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/config/db.js:33>).

Fix direction: Choose storage explicitly, wait for database readiness, verify migrations, fail safely in production, and separate liveness from database readiness.

### 8. High: Damaged JSON is overwritten with demo data

Any JSON read/parse error triggers saveStore(initialData), destroying the previous file rather than preserving it for recovery. This was reproduced in memory. Writes replace the complete file directly, without atomic replacement, backup, or coordination between multiple server processes.

Source: [server/data/store.js:305](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:305>).

Fix direction: Use PostgreSQL for production; preserve damaged files and add atomic writes/backups if local mode remains supported.

### 9. High: New bills and quotations retain previous transaction values

BillModal and QuotationModal remain mounted and do not reset their form on a fresh open or after save. The reproduction confirmed the previous route/tour persists; advance, discount, customer, and charges can also carry over, including after selecting another customer.

Source: [client/src/components/bills/BillModal.jsx:48](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillModal.jsx:48>).

Fix direction: Reset a fresh form per new transaction; preserve a draft only through an explicit draft action.

### 10. High: Bills lose kilometre evidence from duty slips

applySlipData computes a fare but does not copy opening/closing readings, totalKm, or ratePerKm into the bill. The print template still renders running charges using those fields, so new linked bills show 0 KM and a zero per-KM rate against a nonzero fare. Direct flat-fare bills use the same misleading line item.

Source: [client/src/components/bills/BillModal.jsx:62](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillModal.jsx:62>).

Fix direction: Persist the meter snapshot for distance billing and distinguish a flat package fare from distance billing in saved and printed invoices.

### 11. High: Duty-slip link is discarded and repeat billing is allowed

The form sends linkedSlipId, but neither storage implementation nor schema saves it. handleSaveBill does not mark the slip Billed. Every slip, including ongoing or already billed ones, remains selectable. Reproduction confirmed linkedSlipId disappears on save.

Source: [server/data/store.js:490](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:490>).

Fix direction: Store the relationship and atomically create the invoice/update the slip, with duplicate-billing protection and appropriate status checks.

### 12. High: Amounts and payment status can contradict each other

The API trusts submitted totals, tax, balance and status instead of recomputing them. It accepted a nonzero fare with totalAmount=1 and balanceDue=-50 in the isolated store. The normal form also allows manually selecting Paid while balanceDue remains 5775. Dashboard collections can therefore disagree with Paid filters.

Source: [server/routes/bills.js:19](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/routes/bills.js:19>).

Fix direction: Validate amounts and compute totals/balance/status on the server from authoritative charges and payment records, using consistent monetary rounding.

### 13. Medium: Selecting zero tax can become five percent after saving

Local storage uses Number(bill.taxPercent) || 5, turning the valid zero selection into five. The PostgreSQL path does the same for a numeric zero payload; a string '0' from the current select behaves differently. BillPrintView has another fallback of || 5. The reproduced record saved taxPercent=5 despite zero input.

Source: [server/data/store.js:513](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:513>).

Fix direction: Use nullish/default checks that preserve zero and align persisted rates with computed tax amounts.

### 14. Medium: Zero driver allowance and zero rate are replaced with defaults

Slip prefill treats 0 rate as 16 and 0 driver allowance as 500. MeterReadingModal uses the same truthy fallback pattern during edit. Reproduction showed a zero allowance becoming 500 without user entry.

Source: [client/src/components/bills/BillModal.jsx:63](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillModal.jsx:63>).

Fix direction: Use nullish coalescing and distinguish a deliberate zero from a missing value.

### 15. High: Invalid readings and malformed data are accepted

Opening 1000, closing 900 and a previous total of 530 saved as Completed with 530 KM. Client recalculation and server fallbacks preserve stale distance for this case. Most fare/reading inputs allow negative values; start/end date order is not checked. Customer POST accepted an object name and numeric phone, which can crash string-based table filters. Updates/status endpoints largely accept arbitrary fields/values.

Source: [server/routes/meterReadings.js:19](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/routes/meterReadings.js:19>).

Fix direction: Add shared validation for types, lengths, allowed fields/statuses, nonnegative amounts, valid date order and odometer order; recompute distance from validated readings.

### 16. High: Outstanding invoices cannot be settled later

Bills have list/create/delete operations only. There is no payment-recording or bill-update endpoint and no corresponding UI. The isolated PATCH request returned 404. After a customer pays a Pending/Partial invoice, its saved balance and dashboard pending collection cannot be updated through the CRM.

Source: [server/routes/bills.js:16](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/routes/bills.js:16>).

Fix direction: Add payment entry/history and derive invoice settlement from payments without deleting/recreating invoices.

### 17. Medium: Printed invoice hides the discount

The form subtracts discount but the print breakdown omits it. A reproduced invoice with subtotal 5980, tax 299, discount 279 and total 6000 prints no discount explanation, so its displayed arithmetic does not reconcile.

Source: [client/src/components/bills/BillPrintView.jsx:246](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillPrintView.jsx:246>).

Fix direction: Render the discount line and ensure the displayed breakdown reconciles to the total.

### 18. Medium: PostgreSQL quotations omit important printed fields

Visibility checks use quote.validityDate, quote.customerEmail and quote.travelDate only, even though their text includes snake_case fallbacks. Rendering a PostgreSQL-shaped quotation omitted its expiry, client email and target travel date.

Source: [client/src/components/quotations/QuotationPrintView.jsx:106](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/quotations/QuotationPrintView.jsx:106>).

Fix direction: Normalize records or use the resolved field values consistently in both conditions and content.

### 19. Medium: Failed data loads and table actions lack useful feedback

Promise.allSettled failures are ignored, so API/database errors appear as empty or stale records. The surrounding catch does not handle individual settled rejections. Delete and status handlers also lack catches/UI error reporting. Offline demo login makes a disconnected dashboard look usable.

Source: [client/src/App.jsx:62](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/App.jsx:62>).

Fix direction: Show errors per failed collection/action, provide retry behavior, and display loading/disconnected states.

### 20. Medium: Customer Total Trips does not track actual trips

New customers always receive totalTrips:0; nothing increments or derives it when slips/bills are created. PostgreSQL customers have no trip-count column or aggregate. CustomerTable therefore displays fixed seed counts or zero rather than actual trip history.

Source: [server/data/store.js:357](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/server/data/store.js:357>).

Fix direction: Define which trip statuses count, then derive the value from related trips consistently.

### 21. Medium: Selections cannot be cleared and slip prefill can keep the wrong phone

Selecting the blank customer/driver option returns without clearing the stored selection. Quotation and meter selectors have equivalent behavior. Applying a different duty slip changes customerName/customerId but never resolves that customer's phone, allowing the previous customer's phone to remain on the new invoice.

Source: [client/src/components/bills/BillModal.jsx:128](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillModal.jsx:128>).

Fix direction: Clear fields when selections are removed and populate customer details together from the chosen customer/slip.

### 22. Medium: Small-screen layout has no mobile navigation adaptation

Sidebar is always 256px wide with shrink-0; App reserves the remaining width and hides outer overflow. On a 375px viewport, only 119px remains before content padding. Navbar also uses a fixed horizontal layout. This is a source-level layout finding, not a completed browser/device test.

Source: [client/src/components/Sidebar.jsx:25](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/Sidebar.jsx:25>).

Fix direction: Provide a collapsible/mobile drawer and responsive header, then verify forms/tables on target phones.

### 23. Low: Malformed saved login can blank the application

JSON.parse of the browser's saved user runs during initial render without a guard. A malformed saved value reproduced an initialization exception.

Source: [client/src/App.jsx:22](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/App.jsx:22>).

Fix direction: Catch parse failures, clear invalid saved state and return to login; verify the session with the server.

### 24. Medium: Invoice date is taken from the trip start

The invoice Date label prioritizes startDate over createdAt. A bill raised after the trip, or for a future trip, therefore displays the trip start as the invoice date despite having separate trip-date fields.

Source: [client/src/components/bills/BillPrintView.jsx:82](<C:/Users/advai/OneDrive/Desktop/Japgtap Tours CRM/client/src/components/bills/BillPrintView.jsx:82>).

Fix direction: Store/use an explicit invoice issue date, distinct from the journey dates.

## Hosting-readiness gaps

### D1. High: Dependency advisories need remediation

Server npm audit reported 2 moderate affected-package entries (Express and qs). Client reported 1 high and 1 moderate entry (Vite and esbuild). These are package entries, not four independent exploitable vulnerabilities. Several frontend advisories concern development servers or Windows and do not imply that the static production bundle has the same exposure. Upgrade compatible patched versions and rerun checks; do not publish the Vite development server. [Reference](https://github.com/advisories/GHSA-fx2h-pf6j-xcff).

### D2. High: Production build/start and API routing need configuration

The root package has no standard start/build scripts or workspaces/install orchestration. The frontend uses /api, and its only proxy is Vite's development-server proxy to localhost:5000. Express does not serve the frontend build. A static frontend deployment therefore needs explicit API routing, or the backend must serve the build. A Dockerfile is optional with Coolify build packs; its absence alone is not a bug. Also, the root client script is broken: npm --prefix client dev returned Unknown command: dev. [Reference](https://coolify.io/docs/applications/builds/nixpacks/deploy).

### D3. High: Persistence and restore strategy are missing from the project

No deployment volume/backup configuration is present. If JSON fallback is retained in a container without a mount, newly entered data can disappear on container replacement. PostgreSQL also needs persistent database storage and tested backups. Mount the actual data path for the chosen image rather than guessing /app. Persistent storage is not a backup. [Reference](https://coolify.io/docs/core/persistent-storage/storage-mounts/overview).

### D4. High: Company/payment settings and repository exclusions need preparation

Invoice address, phone, GSTIN, bank account, IFSC and UPI details are hardcoded. Their accuracy was not verified; configure and confirm the real business values before issuing documents. The project contains server/.env and db.json but no root/server ignore rules; client/.gitignore does not protect them. No .git directory is present, so this is exposure risk for future upload, not evidence that secrets were published. Keep credentials/data out of Git and image build contexts; provision secrets in Coolify.

### D5. Medium: Repeatable validation and release checks are absent

Original package scripts contain no tests or lint checks, and there is no automated migration/release workflow. The README only describes local development and incorrectly implies that adding PostgreSQL credentials completes the transition. Production still needs fresh-database migration checks, browser flows, mobile/print verification, restart/redeploy persistence checks and backup-restore validation.

## Hostinger and Coolify direction

The proposed platform is viable: Hostinger documents a VPS template with Coolify preinstalled. [Hostinger guide](https://www.hostinger.com/support/9615197-how-to-use-the-coolify-vps-template-at-hostinger/).

After fixing the application, deploy the built React frontend, Express API and PostgreSQL with explicit routing between them; these can be separate resources or a defined container setup. Configure the app's DATABASE_URL for the actual database service. DATABASE_URL takes precedence over the PGHOST/PGPORT/etc. variables in the current code, so editing only those fields while leaving a populated URL will not select the intended database. Execute and verify schema setup before accepting requests.

Recommended work order: secure authentication/API access; repair PostgreSQL compatibility and numbering; make financial/trip workflows consistent; fix form and print bugs; update dependencies; then configure production routing, persistent storage, secrets and backups. Finish with a fresh-database end-to-end test and a restart/redeploy/restore rehearsal before entering real customer data.

