import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Local dev fallback using the same sqlite file wrangler uses, or a fallback test.db
function getLocalSqlite() {
  const d1Dir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    const dbFile = files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
    if (dbFile) {
      return new Database(path.join(d1Dir, dbFile));
    }
  }
  return new Database('local-dev.db');
}

let localDb: any = null;

// This is required to access the Cloudflare D1 binding in Next.js
export function getDb(d1: D1Database) {
  // If running locally without D1 bindings, fallback to Better-SQLite3
  if (!d1 && process.env.NODE_ENV === 'development') {
    if (!localDb) {
      localDb = drizzleSqlite(getLocalSqlite(), { schema });
    }
    return localDb;
  }
  return drizzleD1(d1, { schema });
}
