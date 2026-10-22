import assert from 'node:assert/strict';
import { test } from 'node:test';
import { databaseConfig } from '../../tools/database-config.mjs';

test('external PostgreSQL always verifies TLS certificates', () => {
  const config = databaseConfig('postgres://user:password@db.example.com/db?sslmode=require');
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
  assert.equal(new URL(config.connectionString).searchParams.has('sslmode'), false);
  assert.throws(() => databaseConfig('postgres://user:password@db.example.com/db?sslmode=disable'));
  assert.throws(() => databaseConfig('postgres://user:password@db.example.com/db?uselibpqcompat=true'));
});

test('loopback PostgreSQL supports private test connections', () => {
  assert.equal(databaseConfig('postgres://user:password@127.0.0.1/db').ssl, false);
  assert.throws(() => databaseConfig('https://db.example.com/db'));
  assert.throws(() => databaseConfig('secret-invalid-url'), { message: 'DATABASE_URL must be a valid PostgreSQL URL.' });
});
