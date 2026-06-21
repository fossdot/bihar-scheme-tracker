import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + DB readiness probe for monitoring / uptime checks. 200 when the app can reach
 *  Postgres, 503 otherwise. No data leaked. */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, db: "unconfigured" }, { status: 503 });
  }
  try {
    await query("select 1");
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
