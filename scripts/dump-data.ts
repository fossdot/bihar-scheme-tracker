/**
 * Regenerate the baked deploy seed (deploy/initdb/02_seed_data.sql) from the current database,
 * after running `npm run data:load`. Uses a Postgres 16 pg_dump to match the server image.
 *   npm run data:dump
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { execFileSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set (see .env.local)."); process.exit(1); }

const candidates = [
  "/opt/homebrew/opt/postgresql@16/bin/pg_dump",
  "/usr/local/opt/postgresql@16/bin/pg_dump",
  "pg_dump",
];
const pgDump = candidates.find((c) => c === "pg_dump" || existsSync(c)) ?? "pg_dump";

const out = execFileSync(pgDump, [
  "--data-only", "--disable-triggers", "--no-owner", "--no-privileges", "--column-inserts",
  "--exclude-table-data=public.search_events", // runtime analytics, not seed data
  "--exclude-table-data=public.page_views",    // visitor-path analytics — never seed/commit to the public repo
  url,
], { maxBuffer: 64 * 1024 * 1024 });

const target = join(__dirname, "..", "deploy", "initdb", "02_seed_data.sql");
writeFileSync(target, out);
console.log(`Wrote ${target} (${(out.length / 1024).toFixed(0)} KB) using ${pgDump}`);
