import { type NextRequest } from "next/server";
import { apiError, apiJson, preflight } from "@/lib/api";
import { isDbConfigured, listPolicies } from "@/lib/queries";
import { POLICY_STATUS, policyStatusKey, todayISO } from "@/lib/policy";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/policies — list of policies (optional ?q= name search). Each record carries the
// DERIVED display status (lib/policy.ts) + bilingual label, never the asserted enum column
// (CLAUDE.md: status is derived from evidence, never asserted).
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  try {
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const today = todayISO();
    const results = (await listPolicies({ q })).map((p) => {
      const key = policyStatusKey(p, today);
      return { ...p, status: key, status_en: POLICY_STATUS[key].en, status_hi: POLICY_STATUS[key].hi };
    });
    return apiJson({ count: results.length, results });
  } catch (e) {
    console.error("api/v1/policies:", e);
    return apiError(500, "internal error");
  }
}
