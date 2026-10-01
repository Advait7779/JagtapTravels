const path = require('node:path');
const { Pool, types } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
types.setTypeParser(1082, (value) => value); // DATE is a calendar date, never a timestamp.
function createPool() {
  return new Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }
      : {
          host: process.env.PGHOST,
          port: Number(process.env.PGPORT || 5432),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          connectionTimeoutMillis: 5000,
        },
  );
}
module.exports = { createPool };
