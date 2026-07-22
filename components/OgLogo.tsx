// The logomark for Open Graph images: the same accountability mark as the site logo
// (components/Logo.tsx / app/icon.svg) — a magnifying glass examining a rising budget
// bar-chart on a FOSS-green tile ("scrutinise the money"). satori can't express the lens in
// flexbox, so we hand it the identical SVG as a data-URI <img>, keeping all three copies of the
// mark in sync. Sized by `size` (px).
export function OgLogo({ size }: { size: number }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">` +
    `<rect width="24" height="24" rx="6" fill="#278F5E"/>` +
    `<rect x="7.2" y="10.2" width="1.5" height="2.8" rx="0.6" fill="#ffffff"/>` +
    `<rect x="9.2" y="8.8" width="1.5" height="4.2" rx="0.6" fill="#ffffff"/>` +
    `<rect x="11.2" y="7.4" width="1.5" height="5.6" rx="0.6" fill="#ffffff"/>` +
    `<circle cx="10" cy="10" r="6" fill="none" stroke="#ffffff" stroke-width="2"/>` +
    `<line x1="14.5" y1="14.5" x2="18.5" y2="18.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>` +
    `</svg>`;
  const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  // eslint-disable-next-line @next/next/no-img-element -- satori (OG rendering) has no next/image
  return <img width={size} height={size} src={src} alt="" />;
}
