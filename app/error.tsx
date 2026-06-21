"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

// Route-level error boundary (client component, as Next requires). The root layout
// still wraps this, so we read the locale it set on <html lang>.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    if (document.documentElement.lang === "hi") setLocale("hi");
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {t(locale, "errorTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">{t(locale, "errorBody")}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {t(locale, "tryAgain")}
        </button>
        <a href={`/${locale}`} className="text-sm font-medium text-muted hover:text-ink">
          {t(locale, "backHome")}
        </a>
      </div>
    </div>
  );
}
