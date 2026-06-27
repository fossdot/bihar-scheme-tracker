// Homepage hero mark: an honest "status field" — most schemes unverified (hollow), a few
// verified-active (green) rising to a single verified ✓. Ink = currentColor (set `text-*`);
// single accent green #278F5E. Strokes are weighted to read at small display sizes.
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <polyline points="60,250 150,160 240,70" stroke="#278F5E" strokeWidth="3" strokeDasharray="4 9" opacity="0.5" />
      <g stroke="currentColor" strokeWidth="4">
        <circle cx="150" cy="70" r="7" opacity="0.4" />
        <circle cx="330" cy="70" r="7" opacity="0.2" />
        <circle cx="420" cy="70" r="7" opacity="0.4" />
        <circle cx="60" cy="160" r="7" opacity="0.4" />
        <circle cx="240" cy="160" r="7" opacity="0.2" />
        <circle cx="330" cy="160" r="7" opacity="0.4" />
        <circle cx="150" cy="250" r="7" opacity="0.4" />
        <circle cx="240" cy="250" r="7" opacity="0.4" />
        <circle cx="330" cy="250" r="7" opacity="0.2" />
      </g>
      <circle cx="60" cy="250" r="8" fill="#278F5E" />
      <circle cx="150" cy="160" r="8" fill="#278F5E" />
      <circle cx="240" cy="70" r="15" stroke="#278F5E" strokeWidth="4.5" />
      <path d="M232 70 l5 5 l10 -11" stroke="#278F5E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
