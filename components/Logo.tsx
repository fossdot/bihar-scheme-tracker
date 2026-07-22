// Accountability logomark — a magnifying glass examining a rising budget bar-chart on a
// FOSS-green tile: "scrutinise the money". The lens over the bars signals that this is a
// watchdog / accountability site, not just a data dashboard; the bars keep the mark distinct
// from the plain search glyph in the header. Flat, no gradients; brand green + white are fixed
// so the mark reads on both light and dark headers.
// Kept byte-in-sync with the favicon (app/icon.svg) and the OG-card mark (components/OgLogo.tsx).
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Bihar Education Money logo"
    >
      <rect width="24" height="24" rx="6" fill="#278F5E" />
      {/* budget bars, held under scrutiny */}
      <rect x="7.2" y="10.2" width="1.5" height="2.8" rx="0.6" fill="#ffffff" />
      <rect x="9.2" y="8.8" width="1.5" height="4.2" rx="0.6" fill="#ffffff" />
      <rect x="11.2" y="7.4" width="1.5" height="5.6" rx="0.6" fill="#ffffff" />
      {/* magnifying glass */}
      <circle cx="10" cy="10" r="6" fill="none" stroke="#ffffff" strokeWidth="2" />
      <line x1="14.5" y1="14.5" x2="18.5" y2="18.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
