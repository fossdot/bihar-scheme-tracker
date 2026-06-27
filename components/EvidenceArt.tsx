// Decorative mark for the "About this data" panel: records/sources (one verified-green, with a
// source-link underline) linked along a dashed path to a verified ✓ — "status derived from
// evidence, never asserted." Same visual family as HeroArt. Ink = currentColor (set `text-*`);
// single green accent #278F5E. aria-hidden — the panel copy carries the meaning.
export function EvidenceArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.5">
        <circle cx="26" cy="30" r="6" opacity="0.25" />
        <circle cx="26" cy="90" r="6" opacity="0.25" />
      </g>
      <circle cx="26" cy="60" r="6.5" fill="#278F5E" />
      <polyline
        points="26,60 92,50 124,38"
        stroke="#278F5E"
        strokeWidth="1.4"
        strokeDasharray="2 6"
        opacity="0.45"
        strokeLinecap="round"
      />
      <circle cx="138" cy="34" r="14" stroke="#278F5E" strokeWidth="2" />
      <path
        d="M131 34 l5 5 l10 -11"
        stroke="#278F5E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="40" y1="74" x2="78" y2="74" stroke="#278F5E" strokeWidth="1.4" opacity="0.5" />
    </svg>
  );
}
