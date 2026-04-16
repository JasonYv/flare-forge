import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type AppDatabase = DrizzleD1Database<typeof schema>;

/**
 * Create a Drizzle ORM instance from the Cloudflare D1 binding.
 *
 * Usage:
 *   import { env } from 'cloudflare:workers';
 *   const db = getDb(env.DB);
 *
 * (In Astro v6, `Astro.locals.runtime.env` was removed.)
 */
export function getDb(d1: D1Database): AppDatabase {
  return drizzle(d1, { schema });
}
