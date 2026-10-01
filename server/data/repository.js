const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const lockfile = require('proper-lockfile');
const { createPool } = require('../config/db');
const collections = [
  'users',
  'sessions',
  'customers',
  'drivers',
  'bills',
  'quotations',
  'meterReadings',
  'vehicles',
  'auditLogs',
  'bookings',
  'inquiries',
  'corporateContracts',
  'fuelLogs',
  'tyreLogs',
  'driverAdvances',
  'corporateTripLogs',
];
const emptyState = () => ({
  version: 2,
  counters: {},
  settings: {
    companyName: 'Jagtap Travels',
    ratePerKmSedan: '12',
    ratePerKmErtiga: '14',
    ratePerKmCrysta: '18',
    ratePerKmTempo: '24',
    ratePerKmBus: '38',
    driverAllowanceDay: '500',
    driverAllowanceNight: '700',
    defaultDueDays: '15',
  },
  corporateInvoices: [],
  ...Object.fromEntries(collections.map((k) => [k, []])),
});
const camel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw Error('Invalid CRM data. Restore a verified backup.');
  const data = { ...emptyState(), ...raw };
  data.corporateInvoices = Array.isArray(raw.corporateInvoices) ? raw.corporateInvoices : [];
  for (const name of collections) {
    if (raw[name] !== undefined && !Array.isArray(raw[name]))
      throw Error('Invalid collection: ' + name);
    data[name] = (data[name] || []).map((row) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])),
    );
  }
  // Plaintext/demo credentials from older builds are never accepted as administrators.
  data.users = data.users
    .filter((user) => typeof user.passwordHash === 'string')
    .map(
      ({
        password,
        mfaEnabled,
        mfaSecretEncrypted,
        mfaLastCounter,
        mfaRecoveryCodeHashes,
        mfaEnabledAt,
        ...user
      }) => user,
    );
  data.sessions = data.sessions
    .filter((s) => Number(s.expiresAt) > Date.now())
    .map((session) => ({
      ...session,
      lastSeenAt: session.lastSeenAt || session.createdAt || new Date().toISOString(),
    }));
  for (const b of data.bills) {
    b.invoiceDate ||= (b.createdAt || b.startDate || '').slice(0, 10);
    b.billingType ||= Number(b.totalKm) > 0 ? 'distance' : 'package';
    b.payments ||= [];
    b.totalPaid ??= Number(b.advancePaid || 0);
    b.dueDate ||= b.invoiceDate;
    b.fuelExpense = Number(b.fuelExpense || 0);
    b.tollExpense = Number(b.tollExpense || 0);
    b.driverBattaExpense = Number(b.driverBattaExpense || 0);
    b.otherExpense = Number(b.otherExpense || 0);
    b.totalExpense = Number(
      b.totalExpense !== undefined
        ? b.totalExpense
        : b.fuelExpense + b.tollExpense + b.driverBattaExpense + b.otherExpense,
    );
    b.netProfit = Number(
      b.netProfit !== undefined ? b.netProfit : Number(b.totalAmount || 0) - b.totalExpense,
    );
  }
  for (const r of data.meterReadings) {
    r.documents ||= [];
  }
  for (const d of data.drivers) {
    d.baseSalary = Number(d.baseSalary || 20000);
    d.documents ||= [];
  }
  for (const v of data.vehicles) {
    v.kmLogs ||= [];
    v.serviceHistory ||= [];
    v.documents ||= [];
    v.tyreHistory ||= [];
    v.serviceIntervalKm = Number(v.serviceIntervalKm) || 30000;
    v.lastServiceKm = Number(v.lastServiceKm) || 0;
    v.currentOdometer = Number(v.currentOdometer) || 0;
    if (v.initialOdometer === undefined || v.initialOdometer === null) {
      const tripStarts = data.corporateTripLogs
        .filter((log) => String(log.vehicleId || '') === String(v.id || ''))
        .map((log) => Number(log.startKm))
        .filter(Number.isFinite);
      const dailyStarts = v.kmLogs
        .map((log) => Number(log.odometerReading) - Number(log.dailyKm))
        .filter(Number.isFinite);
      v.initialOdometer = Math.max(
        0,
        Math.min(v.currentOdometer, ...tripStarts, ...dailyStarts),
      );
    } else {
      v.initialOdometer = Number(v.initialOdometer) || 0;
    }
    v.rcExpiryDate ||= '';
  }
  data.version = 2;
  return data;
}
class Repository {
  constructor({
    mode = process.env.STORAGE_MODE || 'json',
    file = process.env.DATA_FILE || path.resolve(__dirname, 'db.json'),
    pool,
  } = {}) {
    if (!['json', 'postgres'].includes(mode)) throw Error('STORAGE_MODE must be json or postgres.');
    if (
      process.env.NODE_ENV === 'production' &&
      mode !== 'postgres' &&
      process.env.ALLOW_JSON_PRODUCTION !== 'true'
    )
      throw Error(
        'Production requires STORAGE_MODE=postgres. JSON requires an explicit ALLOW_JSON_PRODUCTION=true override.',
      );
    this.mode = mode;
    this.file = path.resolve(file);
    this.pool = mode === 'postgres' ? pool || createPool() : null;
    this.pool?.on?.('error', (err) => console.error('PostgreSQL pool:', err.message));
  }
  async initialize() {
    if (this.pool) {
      await this.health();
      return;
    }
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const handle = await fs.open(this.file, 'wx', 0o600);
      await handle.writeFile(JSON.stringify(emptyState(), null, 2));
      await handle.close();
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
    await this.read();
  }
  async read() {
    if (this.pool) {
      const result = await this.pool.query(
        'SELECT payload FROM crm_state WHERE id=1 AND schema_version=2',
      );
      if (!result.rows.length)
        throw Error('Run npm run db:migrate before starting PostgreSQL mode.');
      return normalize(result.rows[0].payload);
    }
    return normalize(JSON.parse(await fs.readFile(this.file, 'utf8')));
  }
  async change(fn) {
    if (this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          'SELECT payload FROM crm_state WHERE id=1 AND schema_version=2 FOR UPDATE',
        );
        if (!result.rows.length) throw Error('Database schema is not initialized.');
        const state = normalize(result.rows[0].payload);
        const value = await fn(state);
        await client.query('UPDATE crm_state SET payload=$1::jsonb, updated_at=NOW() WHERE id=1', [
          JSON.stringify(state),
        ]);
        await client.query('COMMIT');
        return value;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    const release = await lockfile.lock(this.file, {
      retries: { retries: 30, minTimeout: 20, maxTimeout: 200 },
      stale: 30000,
      update: 10000,
    });
    let temp;
    try {
      const state = await this.read(); // Parse before backup or writes: corrupted data is preserved.
      const value = await fn(state);
      await fs.copyFile(this.file, this.file + '.bak');
      temp = this.file + '.' + crypto.randomUUID() + '.tmp';
      const handle = await fs.open(temp, 'wx', 0o600);
      try {
        await handle.writeFile(JSON.stringify(state, null, 2));
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(temp, this.file);
      temp = null;
      return value;
    } finally {
      if (temp) await fs.unlink(temp).catch(() => {});
      await release();
    }
  }
  async health() {
    await this.read();
    return {
      storage: this.mode,
      postgres: { configured: this.mode === 'postgres', connected: this.mode === 'postgres' },
    };
  }
  async close() {
    await this.pool?.end();
  }
}
module.exports = { Repository, emptyState, normalize, collections };
