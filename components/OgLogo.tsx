// The logomark for Open Graph images, rendered with satori-compatible flexbox so it matches
// the site logo (components/Logo.tsx / app/icon.svg): a green rounded tile with three white
// ascending bars. Sized by `size` (px).
const BRAND = "#278F5E";

export function OgLogo({ size }: { size: number }) {
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;
  const bw = Math.round(size * 0.12);
  const bar = (h: number) => ({
    display: "flex",
    width: bw,
    height: Math.round(h),
    borderRadius: 2,
    backgroundColor: "#ffffff",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: Math.round(size * 0.08),
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        backgroundColor: BRAND,
        paddingBottom: pad,
      }}
    >
      <div style={bar(inner * 0.45)} />
      <div style={bar(inner * 0.72)} />
      <div style={bar(inner)} />
    </div>
  );
}
