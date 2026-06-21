"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires one privacy-respecting page-view beacon per path (incl. client-side navigations).
// navigator.sendBeacon survives page unload and doesn't block rendering. Sends ONLY the
// path — no cookies, no identity. The server derives locale + scheme/policy id from it.
export function ViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || typeof navigator === "undefined" || !navigator.sendBeacon) return;
    try {
      const blob = new Blob([JSON.stringify({ path: pathname })], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } catch {
      /* never let analytics break the page */
    }
  }, [pathname]);
  return null;
}
