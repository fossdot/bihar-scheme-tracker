import { apiError, apiJson, isUuid, preflight, publicRow } from "@/lib/api";
import { getSchemeDetail, isDbConfigured } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/schemes/{id} — full scheme detail (embedding + search columns stripped).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  if (!isUuid(params.id)) return apiError(404, "scheme not found");
  try {
    const detail = await getSchemeDetail(params.id);
    if (!detail) return apiError(404, "scheme not found");
    return apiJson({ ...detail, scheme: publicRow(detail.scheme) });
  } catch (e) {
    console.error("api/v1/schemes/[id]:", e);
    return apiError(500, "internal error");
  }
}
