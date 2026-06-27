// Decorative homepage hero mark: an honest "status field" — most schemes unverified (hollow),
// a few verified-active (solid green) rising on a path to a single verified ✓. Pure inline SVG,
// no deps. Ink uses currentColor (set `text-*` on the element) so it adapts to light/dark; the
// single accent is FOSS green #278F5E. aria-hidden — the heading carries the meaning.
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* path from the verified-active dots up to the check */}
      <polyline
        points="60,250 150,160 240,70"
        stroke="#278F5E"
        strokeWidth="1.3"
        strokeDasharray="2 6"
        opacity="0.4"
      />
      {/* the field — three honest states (possibly-active / faint-inactive) */}
      <g stroke="currentColor" strokeWidth="1.5">
        <circle cx="150" cy="70" r="6" opacity="0.28" />
        <circle cx="330" cy="70" r="6" opacity="0.12" />
        <circle cx="420" cy="70" r="6" opacity="0.28" />
        <circle cx="60" cy="160" r="6" opacity="0.28" />
        <circle cx="240" cy="160" r="6" opacity="0.12" />
        <circle cx="330" cy="160" r="6" opacity="0.28" />
        <circle cx="420" cy="160" r="6" opacity="0.12" />
        <circle cx="150" cy="250" r="6" opacity="0.28" />
        <circle cx="240" cy="250" r="6" opacity="0.28" />
        <circle cx="330" cy="250" r="6" opacity="0.12" />
        <circle cx="420" cy="250" r="6" opacity="0.28" />
      </g>
      {/* verified-active */}
      <circle cx="60" cy="250" r="6.5" fill="#278F5E" />
      <circle cx="150" cy="160" r="6.5" fill="#278F5E" />
      {/* the verified ✓ */}
      <circle cx="240" cy="70" r="13" stroke="#278F5E" strokeWidth="2" />
      <path
        d="M233.5 70 l4.5 4.5 l9 -10"
        stroke="#278F5E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
