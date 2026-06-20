import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bihar Scheme Tracker — find government schemes you qualify for";

const BRAND = "#278F5E";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", gap: "28px", backgroundColor: "#ffffff",
          padding: "80px", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", width: "56px", height: "56px", borderRadius: "12px", backgroundColor: BRAND }} />
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 600, color: "#111111" }}>Bihar Scheme Tracker</div>
        </div>
        <div style={{ display: "flex", fontSize: "66px", fontWeight: 700, color: "#111111", lineHeight: 1.1, maxWidth: "920px" }}>
          Find the government schemes you qualify for
        </div>
        <div style={{ display: "flex", fontSize: "30px", color: "#555555", maxWidth: "920px" }}>
          Bihar & central schemes — real status, eligibility, benefits, and official apply links. Source-verified.
        </div>
        <div style={{ display: "flex", fontSize: "26px", color: "#888888" }}>yojana.bodhya.net</div>
      </div>
    ),
    { ...size }
  );
}
