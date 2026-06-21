import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

// Styled, bilingual 404 — replaces Next's default unstyled page for any unknown
// route or a notFound() call from a scheme/policy that doesn't exist.
export default function NotFound() {
  const locale = getLocale();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        {t(locale, "notFoundTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">{t(locale, "notFoundBody")}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        {t(locale, "backHome")}
      </Link>
    </div>
  );
}
