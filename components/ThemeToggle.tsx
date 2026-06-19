"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type Theme = "light" | "dark";

/** Single icon button that toggles light ⇄ dark. Shows the icon of the mode you'll switch TO
 *  (moon in light, sun in dark). Persists to a cookie so the server renders the right theme. */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? "Switch to dark theme" : "Switch to light theme"}
      title={next === "dark" ? "Dark theme" : "Light theme"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-paper hover:text-ink"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
    </button>
  );
}
