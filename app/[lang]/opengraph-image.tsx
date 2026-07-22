import { ImageResponse } from "next/og";
import { OgLogo } from "@/components/OgLogo";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bihar Education Money — where Bihar’s education money goes";

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
          <OgLogo size={56} />
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 600, color: "#111111" }}>Bihar Education Money</div>
        </div>
        <div style={{ display: "flex", fontSize: "66px", fontWeight: 700, color: "#111111", lineHeight: 1.1, maxWidth: "920px" }}>
          Where Bihar’s education money goes
        </div>
        <div style={{ display: "flex", fontSize: "30px", color: "#555555", maxWidth: "920px" }}>
          Released, drawn down, verified — the trail keeps ending in the same place. India’s poorest state, its children’s money. Source-verified.
        </div>
        <div style={{ display: "flex", fontSize: "26px", color: "#888888" }}>yojana.bodhya.net</div>
      </div>
    ),
    { ...size }
  );
}
