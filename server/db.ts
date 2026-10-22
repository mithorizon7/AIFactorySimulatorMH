import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { databaseConfig } from '../tools/database-config.mjs';

const connectionString = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'production' && process.env.REPL_ID && !connectionString) {
  throw new Error('Hosted production requires DATABASE_URL; in-memory fallback is not durable.');
}

export const pool = connectionString ? new Pool(databaseConfig(connectionString)) : null;
export const db = pool ? drizzle({ client: pool, schema }) : null;
