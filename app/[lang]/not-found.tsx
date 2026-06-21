import Link from "next/link";
import { localizedHref, t } from "@/lib/i18n";
import { getLocaleFromHeaders } from "@/lib/locale";

// Localized 404 for in-segment misses — notFound() from /[lang]/schemes/[id] &
// /[lang]/policies/[id], and unknown /[lang]/* paths. not-found components receive no
// route params, so the locale comes from the middleware-injected x-locale header.
export default function LangNotFound() {
  const locale = getLocaleFromHeaders();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        {t(locale, "notFoundTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">{t(locale, "notFoundBody")}</p>
      <Link
        href={localizedHref(locale, "/")}
        className="mt-6 inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        {t(locale, "backHome")}
      </Link>
    </div>
  );
}
