// "About the data" mark: a source document with text lines, a green source-link, and a verified
// seal — "status derived from evidence, never asserted." Distinct silhouette from the hero field.
// Used on the homepage coverage panel and the /about page. Ink = currentColor; accent #278F5E.
export function EvidenceArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M150 70 h120 l30 30 v160 h-150 z M270 70 v30 h30"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.32"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="4" opacity="0.22">
        <line x1="172" y1="118" x2="278" y2="118" />
        <line x1="172" y1="144" x2="278" y2="144" />
        <line x1="172" y1="170" x2="248" y2="170" />
      </g>
      <line x1="172" y1="200" x2="238" y2="200" stroke="#278F5E" strokeWidth="4.5" />
      <line x1="172" y1="214" x2="238" y2="214" stroke="#278F5E" strokeWidth="3" opacity="0.5" />
      <circle cx="300" cy="234" r="24" fill="rgb(var(--surface))" />
      <circle cx="300" cy="234" r="19" stroke="#278F5E" strokeWidth="4.5" />
      <path d="M290 234 l7 7 l13 -15" stroke="#278F5E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
