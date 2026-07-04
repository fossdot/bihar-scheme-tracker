import { apiError, apiJson, isUuid, preflight, publicRow } from "@/lib/api";
import { getPolicyDetail, isDbConfigured } from "@/lib/queries";
import { POLICY_STATUS, policyStatusKey, todayISO } from "@/lib/policy";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/policies/{id} — full policy detail.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  if (!isUuid(params.id)) return apiError(404, "policy not found");
  try {
    const detail = await getPolicyDetail(params.id);
    if (!detail) return apiError(404, "policy not found");
    // Override the stored (asserted) status with the DERIVED display status + bilingual label,
    // so the API matches the UI and never asserts (CLAUDE.md).
    const key = policyStatusKey(detail.policy, todayISO());
    const policy = { ...publicRow(detail.policy), status: key, status_en: POLICY_STATUS[key].en, status_hi: POLICY_STATUS[key].hi };
    return apiJson({ ...detail, policy });
  } catch (e) {
    console.error("api/v1/policies/[id]:", e);
    return apiError(500, "internal error");
  }
}
