// Replit Helium uses a private, app-local PostgreSQL endpoint without TLS.
// All external database endpoints must validate their server certificate.
export function databaseConfig(connectionString) {
  let url;
  try { url = new URL(connectionString); }
  catch { throw new Error('DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || (Boolean(process.env.REPL_ID) && url.hostname === 'helium');
  if (url.searchParams.has('uselibpqcompat')) {
    throw new Error('Database TLS compatibility overrides are not permitted.');
  }
  if (!local && url.searchParams.get('sslmode') === 'disable') {
    throw new Error('External database connections require validated TLS.');
  }
  // Avoid pg connection-string SSL options overriding the explicit policy.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl']) {
    url.searchParams.delete(key);
  }
  return {
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
  };
}
