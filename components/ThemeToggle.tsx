"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type Theme = "light" | "dark";

/** Single icon button that toggles light ⇄ dark. The theme itself is applied before paint by the
 *  inline script in the root layout (reading the `theme` cookie), so server HTML is theme-agnostic
 *  and fully edge-cacheable. This button only reflects + flips the current state.
 *
 *  Initial state is "light" on BOTH server and first client render (so hydration matches with no
 *  warning); the effect then reads the real theme from the <html> class the inline script set and
 *  corrects the icon. Writes the cookie (source of truth for the inline script) + localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode / storage disabled — cookie is enough */
    }
  }

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={next === "dark" ? "Switch to dark theme" : "Switch to light theme"}
      title={next === "dark" ? "Dark theme" : "Light theme"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-paper hover:text-ink"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
    </button>
  );
}
