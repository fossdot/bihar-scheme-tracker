import { type NextRequest } from "next/server";
import { apiError, apiJson, preflight } from "@/lib/api";
import { isDbConfigured, listPolicies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/policies — list of policies (optional ?q= name search).
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  try {
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const results = await listPolicies({ q });
    return apiJson({ count: results.length, results });
  } catch (e) {
    console.error("api/v1/policies:", e);
    return apiError(500, "internal error");
  }
}
