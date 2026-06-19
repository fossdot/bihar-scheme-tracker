"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** EN ⇄ हिं switch. Persists the choice to a cookie and refreshes so server
 *  components re-render in the chosen language. English is the default. */
export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
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
