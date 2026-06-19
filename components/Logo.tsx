// Minimal logomark — FOSS-green rounded tile with three ascending bars (the "tracker" idea).
// Flat, no gradients; brand green is fixed so it reads on both light and dark headers.
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Bihar Scheme Tracker logo"
    >
      <rect width="24" height="24" rx="6" fill="#278F5E" />
      <rect x="5.5" y="13" width="3.2" height="5" rx="1" fill="#ffffff" />
      <rect x="10.4" y="10" width="3.2" height="8" rx="1" fill="#ffffff" />
      <rect x="15.3" y="6.5" width="3.2" height="11.5" rx="1" fill="#ffffff" />
    </svg>
  );
}
