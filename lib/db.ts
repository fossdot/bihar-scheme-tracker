import { Pool, types } from "pg";

// node-postgres defaults: DATE (oid 1082) -> JS Date, NUMERIC (1700) -> string.
// Normalize to match our row types: DATE stays a 'YYYY-MM-DD' string (no timezone
// surprises), NUMERIC becomes a number.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

// Singleton pool cached on globalThis so Next dev hot-reloads don't leak pools.
const g = globalThis as unknown as { __pgPool?: Pool };

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — see .env.local.example.");
  }
  if (!g.__pgPool) {
    // Bounded pool sized for a small (512MB) box; idle clients reaped; a stuck connect fails fast.
    g.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    // Never let a background client error crash the process.
    g.__pgPool.on("error", (err) => console.error("[pg] idle client error:", err.message));
  }
  return g.__pgPool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}
