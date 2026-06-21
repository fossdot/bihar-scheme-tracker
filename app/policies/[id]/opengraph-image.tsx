import { ImageResponse } from "next/og";
import { OgLogo } from "@/components/OgLogo";
import { getPolicyDetail, isDbConfigured } from "@/lib/queries";
import { POLICY_STATUS, policyStatusKey, todayISO } from "@/lib/policy";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bihar Scheme Tracker — policy";

const BRAND = "#278F5E";
const STATUS_COLOR: Record<string, string> = {
  open: BRAND, in_force: BRAND, draft_closed: "#B45309", lapsed: "#6B7280", superseded: "#6B7280",
};

export default async function Image({ params }: { params: { id: string } }) {
  let name = "Bihar Scheme Tracker";
  let summary = "Bihar government policies & frameworks";
  let statusLabel = "Policy";
  let color = BRAND;
  if (isDbConfigured()) {
    try {
      const d = await getPolicyDetail(params.id);
      if (d) {
        name = d.policy.name_en;
        summary = d.policy.summary_en || summary;
        const key = policyStatusKey(d.policy, todayISO());
        statusLabel = POLICY_STATUS[key]?.en ?? "Policy";
        color = STATUS_COLOR[key] ?? BRAND;
      }
    } catch { /* defaults */ }
  }
  const sub = summary.length > 116 ? `${summary.slice(0, 113)}…` : summary;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#ffffff", padding: "64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <OgLogo size={44} />
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 600, color: "#111111" }}>Bihar Scheme Tracker</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", fontSize: "12px" }} />
          <div style={{ display: "flex", fontSize: name.length > 46 ? "52px" : "64px", fontWeight: 700, color: "#111111", lineHeight: 1.12 }}>{name}</div>
          <div style={{ display: "flex", fontSize: "29px", color: "#555555" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", width: "18px", height: "18px", borderRadius: "9px", backgroundColor: color }} />
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 600, color: "#111111" }}>{statusLabel}</div>
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: "#888888" }}>yojana.bodhya.net</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
