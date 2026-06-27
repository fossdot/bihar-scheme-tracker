"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizedHref, t, type Locale, type StringKey } from "@/lib/i18n";

const ITEMS: { path: string; key: StringKey }[] = [
  { path: "/search", key: "navSchemes" },
  { path: "/policies", key: "navPolicies" },
  { path: "/rti", key: "navRti" },
  { path: "/about", key: "navAbout" },
];

// Primary nav: a horizontal row on desktop and a hamburger dropdown on mobile (the row was
// previously md:hidden with no fallback, so phone users couldn't navigate). Active link gets
// aria-current="page".
export function SiteNav({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = (path: string) => {
    const href = localizedHref(locale, path);
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative flex items-center">
      {/* Desktop */}
      <nav className="hidden items-center gap-5 text-sm md:flex">
        {ITEMS.map((it) => (
          <Link
            key={it.path}
            href={localizedHref(locale, it.path)}
            aria-current={active(it.path) ? "page" : undefined}
            className={active(it.path) ? "font-medium text-ink" : "text-muted hover:text-ink"}
          >
            {t(locale, it.key)}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={t(locale, "navMenu")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          {open ? (
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          ) : (
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" />
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <nav
          id="mobile-nav"
          className="absolute left-0 top-full z-50 mt-2 min-w-[11rem] rounded-md border border-line bg-surface p-2 text-sm md:hidden"
        >
          {ITEMS.map((it) => (
            <Link
              key={it.path}
              href={localizedHref(locale, it.path)}
              aria-current={active(it.path) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-2 ${active(it.path) ? "font-medium text-ink" : "text-muted hover:bg-paper hover:text-ink"}`}
            >
              {t(locale, it.key)}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
