# Jagtap Tours And Travels CRM

React frontend and Express API with explicit local JSON or PostgreSQL storage. Node.js 22.13+ is required; Node.js 24 LTS is recommended.

## Run now without PostgreSQL

From the project root:

```powershell
npm ci
npm run install:all
npm run build
npm start
```

Open http://localhost:5000. The server serves the built frontend and /api from the same origin.

On first launch, copy the **first-run setup code** from the server terminal into the setup form, then choose your own email and a password of at least 12 characters. Old demo credentials are disabled. Passwords are scrypt hashed; sessions use expiring HttpOnly cookies with CSRF checks, a 7-day default inactivity limit and logout revocation. Do not share the setup code.

After signing in as the administrator, open **Business Settings → Team users** to create, edit, disable or remove staff accounts. Staff can edit bookings, leads, meter readings, regular quotations, fuel, tyres, vehicles, drivers and customers. Corporate quotations, contracts and invoices, billing, payroll, business settings, uploaded company documents and security audit records are administrator-only. Staff receive only the company contact details needed for regular quotations; driver salaries and uploaded documents are removed from staff API responses. Active keyboard, pointer, touch and scrolling activity in the visible CRM renews the server session at a controlled interval; a genuinely inactive session still expires.

Local storage is the default. Existing server/data/db.json is retained. Changes use a file lock, a previous-version .bak, and an atomic replacement. Corrupted JSON fails explicitly; it is never replaced with demo data. The first write upgrades legacy fields and removes obsolete demo users while preserving business records. Make an export before migration.

For frontend development, run these in separate terminals:

```powershell
npm run server:dev
npm run client
```

Open http://localhost:5173. Both ports must be running; the development proxy forwards /api to port 5000.

Visit **Business Settings** to enter verified company, contact, GSTIN, bank and UPI details. New invoices and quotations snapshot these settings. Blank payment fields are omitted from documents. Existing historical documents use the configured details when they have no snapshot.

The public booking form prepares an email to `bookings@jagtaptravels.com`; it does not claim a booking was received until the visitor sends that message from their email app. Verify this address, the public office address and all tour descriptions before publishing the domain.

## Vehicle servicing and documents

- Each vehicle has its own maintenance interval, with 30,000 KM as the default. Daily KM entries update the odometer, show an approaching warning for the final 2,000 KM, and mark the vehicle **Service Due** at the configured target.
- Recording workshop service stores the date, odometer, garage, cost and notes, then starts the next interval from that service odometer. Odometers cannot move behind recorded history, and future or out-of-order service dates are rejected.
- The **Meter Readings** document action accepts genuine PDF, JPEG, PNG and WebP files up to 10 MB. Files require an administrator session and CSRF token; uploaded content is signature checked, stored under generated names, and linked to the exact vehicle registration plate when one exists.
- Deleting a duty slip or vehicle with document/service history is blocked until its protected records are removed through the appropriate workflow.

## Fleet contracts, operating costs and payroll

- **Corporate Quotations** lets administrators prepare one or more monthly vehicle offers. The short form asks for the company, phone, proposed start date, tax treatment, and each vehicle's fixed fare, included KM and excess-KM rate. Quotations can be edited with previous versions retained. The PDF/print view keeps the established branded layout with only the essential proposal details. The server recalculates totals and keeps corporate pricing hidden from staff. The quotation list offers View/PDF and Edit, without an action to create contracts.
- Corporate contracts track the assigned company, vehicle and driver, contract dates, monthly base fare, included KM and excess-KM rate. Monthly summaries include only KM logged inside the contract period. Invoice generation supplies valid billing dates and prevents a second active invoice for the same contract and month.
- Driver payroll uses each driver's configured base salary and subtracts advances for the selected salary month. The UI and API prevent total advances from exceeding that month's base salary.
- Fuel entries support Diesel, Petrol and CNG, require an odometer, and calculate cost from quantity × rate on the server. Consecutive fills show per-vehicle efficiency as KM/L or KM/kg.
- Tyre records track vehicle, position, quantity, brand, cost and replacement odometer. Create, edit and delete operations keep the vehicle tyre history synchronized.
- Driver licenses and vehicle RCs support authenticated image/PDF uploads. Removing a directly uploaded document also removes its stored binary; RC, PUC, insurance, fitness, permit and road-tax dates produce expiry reminders.
- Corporate invoices have a dedicated searchable register with GST/non-GST filters, date search, pagination, view/print/edit and protected deletion. The server validates invoice fields, assigns UUIDs, prevents duplicate invoice numbers and recalculates line totals, taxable value, CGST, SGST and grand total before saving.

## Storage selection

Set values in server/.env (local) or in Coolify environment variables (hosted). Do not commit .env or CRM data.

- STORAGE_MODE=json: local development, no PostgreSQL connection attempted.
- DATA_FILE: optional absolute path; defaults to server/data/db.json.
- UPLOADS_DIR: directory for uploaded document binaries; defaults to server/data/uploads. This directory requires its own persistent volume and backup in containers.
- STORAGE_MODE=postgres: use PostgreSQL only. Connection/schema failures stop startup or return a failed readiness check; the process never switches to JSON.
- DATABASE_URL: PostgreSQL connection string. If set, it overrides PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE.
- NODE_ENV=production: enables secure session cookies. Serve through HTTPS.
- TRUST_PROXY=1: use when exactly one trusted reverse proxy (e.g. Coolify) sits in front of the app; keep the application port private.
- ADMIN_EMAIL: recommended first-run administrator login username. It must be an email address.
- ADMIN_PASSWORD: recommended first-run administrator password, with at least 12 characters. It is used only when the database contains no users and never resets an existing account.
- ADMIN_FULL_NAME: optional first-run display name; defaults to `Administrator`.
- SETUP_TOKEN: a random code of at least 32 characters for first administrator creation in production. Remove it after setup.
- SESSION_IDLE_MINUTES: administrator inactivity timeout; defaults to 10080 minutes (7 days) and can be set from 5 to 10080 minutes.
- PORT: default 5000.

Production requires PostgreSQL by default. If you deliberately run JSON while staging, set ALLOW_JSON_PRODUCTION=true, use one application service on one server, and mount the DATA_FILE directory. This explicit override does not enable database fallback.

## Add PostgreSQL later

1. Back up JSON and stop the local application before the final export/import cutover.
2. Create an empty database and set STORAGE_MODE=postgres and DATABASE_URL in server/.env or Coolify.
3. Run the schema migration:

```powershell
npm run db:migrate
```

4. Import the existing JSON records into the empty target:

```powershell
$env:IMPORT_FILE = 'C:\Users\advai\OneDrive\Desktop\Japgtap Tours CRM\server\data\db.json'
npm run db:import
Remove-Item Env:IMPORT_FILE
```

5. Start the application and verify customer counts, invoice numbers, balances, dates, driver status changes and payments. Existing administrator hashes are preserved during import; sessions are cleared, so sign in again.

The import is transactional and refuses to overwrite a nonempty target. It rejects missing/duplicate document numbers and duplicate IDs. Source JSON is unchanged. There is no automatic background synchronization: after cutover, use PostgreSQL as the source of truth. The JSON export contains document metadata, while uploaded binaries remain in UPLOADS_DIR; copy that directory into the Coolify uploads volume during a migration if it contains files.

**Database layout:** this version stores the validated CRM state in the versioned crm_state JSONB table. A row-level transaction lock makes numbering, invoice/slip transitions and payments atomic. Both adapters use the same business validation and camelCase/date-only records. This design targets a small single-business CRM; each write loads/saves the state, so a normalized relational repository would be appropriate before large-volume scaling. The old relational schema was never connected; its tables, if someone created them separately, are not imported automatically.

## Backups and safe restore

Choose a new backup filename; existing files are never overwritten:

```powershell
$env:BACKUP_FILE = 'C:\CRM-backups\crm-2026-09-12.json'
npm run backup
Remove-Item Env:BACKUP_FILE
```

Copy backups to another machine/storage provider. The local .bak file only contains the immediately previous version and is not a disaster-recovery plan. Configure scheduled off-server backups through your hosting environment. For PostgreSQL, Coolify database backups / pg_dump can supplement the application JSON export. Back up the `uploads_data` volume separately and restore it together with the matching database backup; the database stores document metadata, not the binary files.

Restore into a **new empty** JSON target or a freshly migrated empty PostgreSQL target:

```powershell
$env:RESTORE_FILE = 'C:\CRM-backups\crm-2026-09-12.json'
npm run restore
Remove-Item Env:RESTORE_FILE
```

For a JSON rehearsal, set DATA_FILE to a new path first. Restore refuses nonempty targets and revokes sessions. Check record counts and financial balances before switching production to a restored target.

## Hostinger VPS / Coolify

A production Dockerfile and compose.yaml are included. No hosting resources were created.

Recommended Coolify Docker Compose deployment:

1. Push the project to a private repository, excluding secrets, records, backups and dependencies.
2. Create a Docker Compose application using compose.yaml.
3. In Coolify, set `POSTGRES_PASSWORD` to at least 20 random URL-safe characters. Set `ADMIN_EMAIL` to the email address you will use as the login username, set a strong `ADMIN_PASSWORD` of at least 12 characters, and optionally set `ADMIN_FULL_NAME`. Leave `SETUP_TOKEN` empty when using these administrator variables.
4. Deploy once and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The application creates this account only when the database contains no users. After sign-in succeeds, remove `ADMIN_PASSWORD` (and optionally the other `ADMIN_*` values) from Coolify and redeploy; the account remains in PostgreSQL and its password is not changed on later starts.
5. Assign an HTTPS domain to the crm service at internal port 6001. Coolify routes frontend and API to this same service. No Vite development server is used in production.
6. The PostgreSQL service persists `/var/lib/postgresql/data` in `postgres_data`, and uploaded documents persist in `uploads_data` at `/app/uploads`. Neither PostgreSQL nor the raw upload directory is published to the internet. The CRM waits for database health, runs the idempotent migration, then starts.
7. If migrating real records, import your backup into the empty database **before the first normal deployment**, because administrator bootstrap makes the database nonempty. Run the import command in the CRM container with IMPORT_FILE pointing to a securely supplied JSON file. Remove the transfer file afterward; if the imported data already contains an administrator, the `ADMIN_*` values are ignored.
8. Configure off-server backups for both PostgreSQL and `uploads_data`. Verify HTTPS sessions, `/api/health`, an uploaded document after restart/redeploy, and a paired database/files restore before going live.

For a separately hosted frontend at `https://jagtaptravels.com` and API at `https://api.jagtaptravels.com`, set `VITE_API_BASE_URL=https://api.jagtaptravels.com` as a **build-time** variable on the frontend service and `FRONTEND_ORIGIN=https://jagtaptravels.com` on the API service. Rebuild the frontend and restart the API after setting them. The API allows credentials only from that exact frontend origin; both sites must use HTTPS. Leave these variables unset when the frontend and API use the same CRM service and domain.

When using a separate Coolify PostgreSQL resource, create the API application from this Git repository with the Dockerfile build strategy, Base Directory `/`, Dockerfile Location `Dockerfile`, and exposed port `6001`. Set runtime variables `PORT=6001`, `STORAGE_MODE=postgres`, `DATABASE_URL` to the database's internal URL, `NODE_ENV=production`, `TRUST_PROXY=1`, and the administrator bootstrap variables. Route the API domain to internal port `6001`. The image runs the idempotent database migration before starting the API. For the separate frontend application, use Nixpacks from Base Directory `/client`, enable static site output, set Publish Directory `/dist`, and make `VITE_API_BASE_URL` available during the build. There is no Dockerfile inside `/client` or `/server`.

The Compose service does not publish a host port. Coolify routes to internal port `6001` over the container network; do not expose PostgreSQL or the raw API port publicly. If using a separate Coolify PostgreSQL resource instead of compose.yaml, configure `DATABASE_URL` with its internal connection string; the Dockerfile image runs the migration before starting the application.

Official references:

- [Hostinger Coolify VPS](https://www.hostinger.com/support/9615197-how-to-use-the-coolify-vps-template-at-hostinger/)
- [Coolify persistent storage](https://coolify.io/docs/core/persistent-storage/storage-mounts/overview)

## Billing behavior

- Money is validated and rounded on the server. Client totals are previews.
- Zero tax and zero allowances are preserved. Payment status is derived from receipts.
- Completed duty slips can be billed once. Invoices preserve their meter snapshot and linked slip.
- Use **Payment** in the invoice table to record later receipts. Repeating the same request does not record a second payment.
- Unpaid invoices can be cancelled while retaining their number/history. Paid invoices cannot be deleted or cancelled through this flow.
- Billed slips cannot be edited; related customer/driver history is protected from deletion.
- Trip counts include completed/billed slips plus standalone, noncancelled invoices, without counting a linked invoice twice.
- Invoice issue dates are separate from trip dates. Calendar dates use India business time.
- New forms reset each time; closing a form discards its unsaved contents.

## Verification

```powershell
npm run check
```

For a complete browser workflow, run:

```powershell
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` builds the current frontend first. The browser test creates isolated temporary database and upload folders, then exercises the public website, first-run setup, a 30,000 KM reminder and service reset, corporate quotation creation and print output, protected document upload, invoice/payment settlement, and desktop/mobile navigation. It saves artifacts under test-results. On Windows, set BROWSER_CHANNEL=chrome to use an installed Chrome instead.

The check command runs ESLint correctness checks, backend/API/storage/security tests, frontend regressions and a production build. Backend tests use temporary JSON stores and an in-memory PGlite PostgreSQL engine. They do not touch your CRM records or require your future PostgreSQL service. GitHub Actions also runs dependency audits plus Trivy repository-secret and production-image scans. A live remote PostgreSQL connection, Docker/Coolify rollout and off-server backup configuration still need verification in the actual hosting environment.

The original audit remains in CRM-AUDIT.md as historical context. See FIXES-VERIFIED.md for the implementation and verification status.
