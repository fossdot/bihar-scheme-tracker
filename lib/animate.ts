// Tiny rAF value tween for the interactive widgets (guess reveals, count-ups).
// Client-only. Honours prefers-reduced-motion by jumping straight to the target.

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tween from → to over ms, cubic ease-out, calling fn each frame. Returns a cancel fn. */
export function animateValue(from: number, to: number, ms: number, fn: (v: number) => void): () => void {
  if (prefersReducedMotion() || from === to) {
    fn(to);
    return () => {};
  }
  let raf = 0;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    fn(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
