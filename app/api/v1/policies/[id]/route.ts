import { apiError, apiJson, isUuid, preflight, publicRow } from "@/lib/api";
import { getPolicyDetail, isDbConfigured } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/policies/{id} — full policy detail.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  if (!isUuid(params.id)) return apiError(404, "policy not found");
  try {
    const detail = await getPolicyDetail(params.id);
    if (!detail) return apiError(404, "policy not found");
    return apiJson({ ...detail, policy: publicRow(detail.policy) });
  } catch (e) {
    console.error("api/v1/policies/[id]:", e);
    return apiError(500, "internal error");
  }
}
