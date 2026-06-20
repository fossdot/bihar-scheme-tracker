import { ImageResponse } from "next/og";
import { getSchemeDetail, isDbConfigured } from "@/lib/queries";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bihar Scheme Tracker";

const BRAND = "#278F5E";

function statusView(status?: string): { label: string; color: string } {
  if (status === "active" || status === "likely_active") return { label: "Active", color: BRAND };
  if (status === "dormant" || status === "unknown") return { label: "Possibly active", color: "#B45309" };
  return { label: "Inactive", color: "#6B7280" };
}

export default async function Image({ params }: { params: { id: string } }) {
  let name = "Bihar Scheme Tracker";
  let benefit = "Find government schemes you qualify for";
  let status: string | undefined;
  if (isDbConfigured()) {
    try {
      const d = await getSchemeDetail(params.id);
      if (d) {
        name = d.scheme.name_en;
        benefit = d.scheme.benefit_type || d.scheme.objective_en || benefit;
        status = d.scheme.status;
      }
    } catch { /* fall back to defaults */ }
  }
  const sv = statusView(status);
  const benefitText = benefit.length > 116 ? `${benefit.slice(0, 113)}…` : benefit;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", backgroundColor: "#ffffff",
          padding: "64px", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", width: "44px", height: "44px", borderRadius: "10px", backgroundColor: BRAND }} />
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 600, color: "#111111" }}>Bihar Scheme Tracker</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", fontSize: name.length > 46 ? "54px" : "68px", fontWeight: 700, color: "#111111", lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#555555" }}>{benefitText}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", width: "18px", height: "18px", borderRadius: "9px", backgroundColor: sv.color }} />
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 600, color: "#111111" }}>{sv.label}</div>
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: "#888888" }}>yojana.bodhya.net</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
