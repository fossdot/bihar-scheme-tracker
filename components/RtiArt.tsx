// RTI tracker mark: request rows resolving to received ✓ / filed (dashed ring, awaiting) /
// needed (hollow) — the RTI lifecycle.
export function RtiArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="4">
        <circle cx="70" cy="96" r="7" opacity="0.4" />
        <circle cx="70" cy="180" r="7" opacity="0.4" />
        <circle cx="70" cy="264" r="7" opacity="0.4" />
      </g>
      <g fill="currentColor" opacity="0.22">
        <rect x="96" y="88" width="186" height="16" rx="8" />
        <rect x="96" y="172" width="156" height="16" rx="8" />
        <rect x="96" y="256" width="196" height="16" rx="8" />
      </g>
      <line x1="322" y1="60" x2="322" y2="300" stroke="currentColor" strokeWidth="3" opacity="0.18" />
      <circle cx="372" cy="96" r="14" stroke="#278F5E" strokeWidth="4.5" />
      <path d="M365 96 l5 5 l10 -11" stroke="#278F5E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="372" cy="180" r="12" stroke="#278F5E" strokeWidth="4" strokeDasharray="4 5" />
      <circle cx="372" cy="180" r="3" fill="#278F5E" />
      <circle cx="372" cy="264" r="10" stroke="currentColor" strokeWidth="4" opacity="0.4" />
    </svg>
  );
}
