// Schemes page mark: many candidates funnel down to the one scheme you're eligible for (green ✓).
export function SchemesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="4">
        <circle cx="120" cy="74" r="7" opacity="0.4" />
        <circle cx="190" cy="68" r="7" opacity="0.22" />
        <circle cx="260" cy="70" r="7" opacity="0.4" />
        <circle cx="330" cy="72" r="7" opacity="0.22" />
      </g>
      <circle cx="190" cy="68" r="8" fill="#278F5E" />
      <path d="M96 104 L214 210 M384 104 L266 210" stroke="currentColor" strokeWidth="4" opacity="0.4" strokeLinecap="round" />
      <path d="M214 210 L214 232 a26 26 0 0 0 52 0 L266 210" stroke="currentColor" strokeWidth="4" opacity="0.4" fill="none" />
      <line x1="240" y1="258" x2="240" y2="276" stroke="#278F5E" strokeWidth="3.5" strokeDasharray="3 6" opacity="0.65" />
      <circle cx="240" cy="298" r="16" stroke="#278F5E" strokeWidth="4.5" />
      <path d="M231 298 l6 6 l11 -12" stroke="#278F5E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
