"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";

/** EN ⇄ हिं switch. Locale lives in the URL (/en, /hi), so this navigates to the same
 *  path under the other locale, preserving the query string. No cookie. */
export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setLocale(next: Locale) {
    if (next === locale) return;
    const segments = pathname.split("/");
    // segments[0] is "" (leading slash); segments[1] is the locale prefix.
    if ((LOCALES as readonly string[]).includes(segments[1])) segments[1] = next;
    else segments.splice(1, 0, next); // defensive: no prefix yet → add one
    const qs = searchParams.toString();
    router.push(`${segments.join("/")}${qs ? `?${qs}` : ""}`);
  }

  const opts: { value: Locale; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "hi", label: "हिं" },
  ];

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-md border border-line text-xs"
    >
      {opts.map((o) => {
        const active = o.value === locale;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLocale(o.value)}
            aria-pressed={active}
            className={
              "inline-flex h-8 min-w-[2.25rem] items-center justify-center px-2 text-xs " +
              (active
                ? "bg-brand font-medium text-white"
                : "bg-surface text-ink hover:bg-paper")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
