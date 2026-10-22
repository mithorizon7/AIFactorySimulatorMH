import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { databaseConfig } from './database-config.mjs';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const pool = new Pool(databaseConfig(process.env.DATABASE_URL));
let client;
try {
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query(await readFile(new URL('../migrations/security-save-ownership.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Additive ownership migration applied successfully.');
} catch {
  if (client) await client.query('ROLLBACK');
  console.error('Ownership migration failed; transaction rolled back. No credentials logged.');
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
