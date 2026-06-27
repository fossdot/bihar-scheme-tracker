// Policies page mark: a policy document with a validity window on a timeline + an open-for-comment
// consultation node (derived display status: in-force window, open consultation).
export function PoliciesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M150 92 h70 l18 18 v66 h-88 z M220 92 v18 h18"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.3"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="3.6" opacity="0.26">
        <line x1="166" y1="132" x2="222" y2="132" />
        <line x1="166" y1="152" x2="222" y2="152" />
      </g>
      <line x1="60" y1="244" x2="420" y2="244" stroke="currentColor" strokeWidth="4" opacity="0.3" />
      <g stroke="currentColor" strokeWidth="4" opacity="0.3">
        <line x1="96" y1="244" x2="96" y2="254" />
        <line x1="168" y1="244" x2="168" y2="254" />
        <line x1="240" y1="244" x2="240" y2="254" />
        <line x1="312" y1="244" x2="312" y2="254" />
      </g>
      <path d="M120 216 v-14 h150 v14" stroke="#278F5E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <line x1="120" y1="202" x2="270" y2="202" stroke="#278F5E" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="352" cy="176" r="14" stroke="#278F5E" strokeWidth="4.5" />
      <circle cx="352" cy="176" r="5" fill="#278F5E" />
      <line x1="352" y1="190" x2="352" y2="234" stroke="#278F5E" strokeWidth="3.5" strokeDasharray="3 6" opacity="0.55" />
    </svg>
  );
}
