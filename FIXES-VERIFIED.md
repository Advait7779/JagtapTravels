# CRM fixes and verification

Completed 12 September 2026 against the 24 findings and five deployment gaps in CRM-AUDIT.md. Re-audited 15 September 2026 after vehicle servicing, document uploads and the public website were added. Security hardening was completed on 17 September 2026; role-based access was excluded and MFA was removed at the owner's request. Corporate contracts, payroll advances, fuel/mileage, tyre lifecycle, RTO documents and active-use session renewal were reviewed and reverified on 18 September 2026.

The audited application issues have been addressed. The CRM can run locally using JSON while PostgreSQL is not yet created. No production database was connected and nothing was deployed. The actual Hostinger/Coolify environment still needs the checks below.

## Verification results

| Check                                     | Result                                    |
| ----------------------------------------- | ----------------------------------------- |
| ESLint correctness checks                 | Passed                                    |
| Backend/API/storage/security tests        | 32 passed                                 |
| Frontend regression tests                 | 21 passed across two files                |
| Chrome end-to-end workflow                | 1 passed                                  |
| Production frontend build                 | Passed; 6,554 modules                     |
| Root, server and client dependency audits | Each reported zero known vulnerabilities  |
| Original business data                    | Unchanged during implementation and tests |

Backend tests run against temporary JSON files and the embedded PGlite PostgreSQL engine. PGlite executes the migration and repository SQL; it does not verify a remote PostgreSQL connection, network failures during commit, pooling, TLS or hosting volumes.

The browser test covers the public website and `/admin` route, first administrator setup, business settings, customer creation, a per-vehicle 30,000 KM warning, workshop service reset, authenticated PDF upload, a zero-tax invoice, print preview/PDF generation, later payment settlement, desktop navigation, mobile navigation at 375 x 812, and logout. Multi-page print pagination, physical printers and actual mobile devices still need practical checks with your longer documents.

Test files:

- server/test/crm.test.js
- server/test/documents.test.js
- server/test/vehicles.test.js
- server/test/security.test.js
- client/src/test/workflows.test.jsx
- client/src/test/website.test.jsx
- tests/workflows.spec.cjs

Run `npm run check` for lint, backend/frontend tests and the build. After installing Playwright Chromium, run `npm run test:e2e`. The browser test uses an isolated temporary store and saves artifacts under test-results. GitHub Actions includes these checks and dependency audits.

## Original findings

| Audit ID | Implemented correction                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1        | Business API routes require a verified server session. CSRF validation protects authenticated mutations. Public endpoints are limited to authentication/setup and health.                                                |
| 2        | Removed demo/offline authentication. Added first-run administrator setup, scrypt password hashes, expiring HttpOnly sessions, login throttling and logout revocation. Obsolete browser user objects cannot grant access. |
| 3        | Invoice, quotation and duty-slip counters persist by business year. Locked writes allocate numbers atomically and scan existing records before allocating. Cancellation retains invoice numbers and history.             |
| 4        | Driver status changes preserve all other fields. Both storage adapters use the same validated camelCase records, replacing the defective SQL update route.                                                               |
| 5        | Optional customer/driver references and dates normalize to null. Walk-in documents work with both adapters.                                                                                                              |
| 6        | Calendar dates remain YYYY-MM-DD strings through storage and forms. India business dates are used for new records.                                                                                                       |
| 7        | Storage selection is explicit. PostgreSQL errors never trigger a JSON fallback. Readiness verifies the selected store; startup fails when it is unavailable.                                                             |
| 8        | Corrupt JSON raises an error and remains untouched. Valid updates use locking, a previous-version backup, fsync and atomic replacement. Missing files initialize empty rather than with demo business records.           |
| 9        | Invoice and quotation forms mount fresh and reset their defaults; old transaction values no longer appear in a new form.                                                                                                 |
| 10       | Linked invoices preserve opening/closing odometer readings, distance, rate, allowances and the duty-slip snapshot.                                                                                                       |
| 11       | Invoice creation retains the slip link and marks it billed in the same transaction. Duplicate billing and edits to billed slips are rejected. Cancelling an unpaid invoice releases its slip.                            |
| 12       | The server validates and calculates totals. Paid amount, balance and payment status derive from receipts. Client-supplied totals and status do not override these values.                                                |
| 13       | Zero tax remains zero through entry, storage and printing.                                                                                                                                                               |
| 14       | Zero rate and driver allowance remain zero instead of being replaced by defaults.                                                                                                                                        |
| 15       | Added type, range, reference, date-order and odometer validation. Negative amounts, excessive discounts/advances and malformed submissions are rejected.                                                                 |
| 16       | Added later-payment entry with date, mode, reference and printed payment history. Retry IDs prevent duplicate receipts; overpayment is rejected.                                                                         |
| 17       | Printed invoices show discount, tax, total received and balance as separate amounts.                                                                                                                                     |
| 18       | Quotations print the normalized contact, route, validity, itinerary, inclusions, exclusions and amount fields under either adapter.                                                                                      |
| 19       | Failed loads identify affected collections and offer refresh. Failed mutations and session/network problems show actionable errors.                                                                                      |
| 20       | Customer trip counts derive from completed/billed slips and standalone noncancelled invoices, avoiding double-counting linked bills.                                                                                     |
| 21       | Optional selections can be cleared. Slip prefill uses the selected customer's phone and clears stale meter fields when the link is removed.                                                                              |
| 22       | Added mobile navigation drawer, overlay dismissal, responsive content spacing and horizontally scrollable tables.                                                                                                        |
| 23       | Old saved login JSON is no longer parsed or trusted. A malformed saved value cannot establish a session or blank the login flow.                                                                                         |
| 24       | Invoice issue date is stored separately from trip dates and shown correctly on the document.                                                                                                                             |

Historical business records are retained. Existing documents are not silently rewritten to invent payment history or change their financial values.

## Added-feature review (15 September)

- Restored hashed first-run authentication, CSRF protection and login throttling after the new feature branch had reintroduced plaintext login handling.
- Vehicle registrations are normalized and unique. Odometers cannot move behind KM/service history, future daily/service dates and backdated service-cycle resets are rejected, and assigned drivers or vehicles with history cannot be deleted accidentally.
- Each vehicle uses its configured maintenance interval (default 30,000 KM), with the final 2,000 KM shown as approaching. Workshop records reset the cycle and remain visible in service history.
- Document upload now uses multipart transfer rather than base64 JSON. It allows one genuine PDF/JPEG/PNG/WebP file up to 10 MB, checks both declared MIME and file signature, generates the stored filename, removes failed uploads, and links metadata only by an exact normalized plate.
- Upload serving and deletion require the same authenticated API session and CSRF rules as the rest of the CRM. Backend and browser tests use temporary upload directories.
- Public and admin browser history now preserves `/` and `/admin`; Staff CRM buttons are wired on desktop, mobile and footer views.
- The public booking form no longer displays a false server-received confirmation. It opens a prepared email with the entered trip details and clearly tells the visitor that they must send it.
- The production image uses a nonroot user. Compose persists PostgreSQL and document uploads in separate named volumes and runs the schema migration before startup.

## Security hardening (17 September)

- Removed automatic default-administrator creation, credential logging and the plaintext-password compatibility fallback. First-run setup requires a one-time setup token, and production rejects unsafe startup configuration.
- Added active-session inspection, individual revocation, sign-out everywhere, password-change revocation, absolute expiry and a configurable inactivity timeout (60 minutes by default).
- Added an authenticated security audit page. Mutations and authentication failures are stored in a capped, integrity-chained log without request bodies, passwords, CSRF/session tokens or uploaded document contents.
- Added production checks for PostgreSQL-only storage, trusted proxy configuration, strong database credentials, setup-token length and valid session timeout bounds.
- Added security regressions for authentication, CSRF, session expiry/revocation, password changes, document access, audit redaction/chain verification and production-secret validation.
- Expanded GitHub Actions with npm dependency audits plus Trivy repository-secret and production-image scans; Dependabot now checks all npm workspaces, GitHub Actions and Docker weekly.

## Deployment gaps

| Audit ID | Implemented correction                                                                                                                                                                                        | Remaining hosting work                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| D1       | Updated vulnerable dependencies and lockfiles; all three audits passed. Dependabot and CI dependency/secret/code/image scans are configured.                                                                | Review and merge safe Dependabot updates; investigate any CI security failure before deployment.                                          |
| D2       | Production build/start scripts, same-origin API/static serving, multi-stage nonroot Dockerfile and Compose configuration.                                                                                     | Build the image and test HTTPS/proxy routing on the actual VPS. Docker was unavailable locally.                                           |
| D3       | Explicit storage, PostgreSQL schema migration, guarded JSON import, persistent Compose database and upload volumes, backup/export and restore commands. Backup/restore CLI was tested and refuses overwrites. | Create the database, import records, verify both volumes after restart/redeploy, and configure paired off-server database/upload backups. |
| D4       | Configurable business/contact/payment settings, document snapshots, environment examples and exclusions for secrets/data/backups.                                                                             | Enter your verified company details and production secrets before issuing real documents.                                                 |
| D5       | Repeatable lint, backend/frontend/browser tests, build and CI workflow.                                                                                                                                       | Run the deployment smoke checks against the final host and domain.                                                                        |

## PostgreSQL design and migration

The new PostgreSQL schema uses a versioned singleton crm_state JSONB row. A transaction row lock serializes mutations, including number allocation, payment settlement and invoice/slip transitions. The JSON and PostgreSQL adapters share the same validation and document shapes.

This is suitable for a small single-business CRM. Each mutation reads and writes the full state; large-scale usage would need a normalized relational repository. Any separately created old SQL tables are not imported automatically. The user's database had not been created or connected.

The import command refuses nonempty targets and rejects duplicate IDs or document numbers. It preserves business records, counters and administrator password hashes while clearing sessions. A cutover must stop local writes and import a final backup before using PostgreSQL as the source of truth.

See README.md for local startup, setup, migration, backup/restore and Hostinger/Coolify steps.

## Existing data verification

The current user-provided server/data/db.json is 13,255 bytes with last write time 17 September 2026, 10:11:53 local time. SHA-256 remained `0AACC3A2D48842F2EA0EA146E5C9C734DA6FBCC8CC167F81BF5DBCCA92329B78` before and after the final lint, 53 automated tests, production build and browser workflow.

SHA-256 after verification:
`0AACC3A2D48842F2EA0EA146E5C9C734DA6FBCC8CC167F81BF5DBCCA92329B78`

All implementation tests used separate temporary/test stores. The first real application write will normalize legacy keys and remove obsolete demo credentials while retaining business records.
