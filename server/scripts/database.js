const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
require('../config/db');
const { Repository, normalize, emptyState, collections } = require('../data/repository');
const { createPool } = require('../config/db');
async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      await fs.readFile(path.resolve(__dirname, '../database/schema.sql'), 'utf8'),
    );
    await client.query(
      'INSERT INTO crm_state(id,schema_version,payload) VALUES(1,2,$1::jsonb) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(emptyState())],
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
function validateImport(data) {
  const state = normalize(data);
  state.sessions = [];
  for (const collection of collections) {
    const ids = state[collection].map((r) => String(r.id));
    if (new Set(ids).size !== ids.length)
      throw Error('Duplicate record IDs in ' + collection + '. Repair the source before import.');
  }
  for (const [collection, key] of [
    ['bills', 'billNumber'],
    ['quotations', 'quotationNumber'],
    ['corporateQuotations', 'quotationNumber'],
    ['meterReadings', 'slipNumber'],
  ]) {
    const numbers = state[collection].map((r) => r[key]);
    if (numbers.some((n) => !n) || new Set(numbers).size !== numbers.length)
      throw Error(
        'Missing/duplicate document numbers in ' +
          collection +
          '. Repair the source before import.',
      );
  }
  return state;
}
async function importEmpty(repo, state) {
  state = validateImport(state);
  return repo.change((d) => {
    if (collections.some((k) => d[k].length))
      throw Error('Target is not empty. Import never overwrites existing records.');
    for (const key of Object.keys(d)) delete d[key];
    Object.assign(d, state);
  });
}
async function main() {
  const command = process.argv[2];
  if (command === 'migrate') {
    const pool = createPool();
    try {
      await migrate(pool);
      console.log('Schema ready. Existing data was not overwritten.');
    } finally {
      await pool.end();
    }
    return;
  }
  const repo = new Repository();
  try {
    await repo.initialize();
    if (command === 'import') {
      if (repo.mode !== 'postgres') throw Error('Set STORAGE_MODE=postgres for import.');
      const source = process.env.IMPORT_FILE;
      if (!source) throw Error('Set IMPORT_FILE to the JSON export to import.');
      await importEmpty(repo, JSON.parse(await fs.readFile(path.resolve(source), 'utf8')));
      console.log('Import committed. Source JSON was not changed.');
    } else if (command === 'backup') {
      const destination = process.env.BACKUP_FILE;
      if (!destination) throw Error('Set BACKUP_FILE to a new backup file path.');
      const state = await repo.read();
      state.sessions = [];
      await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
      await fs.writeFile(path.resolve(destination), JSON.stringify(state, null, 2), {
        flag: 'wx',
        mode: 0o600,
      });
      console.log('Backup saved. Keep a copy outside the server and test restore.');
    } else if (command === 'restore') {
      const source = process.env.RESTORE_FILE;
      if (!source) throw Error('Set RESTORE_FILE. Restore only accepts an empty target.');
      await importEmpty(repo, JSON.parse(await fs.readFile(path.resolve(source), 'utf8')));
      console.log('Restored into empty target. Sessions were revoked.');
    } else throw Error('Use migrate, import, backup or restore.');
  } finally {
    await repo.close();
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
module.exports = { migrate, validateImport, importEmpty };
