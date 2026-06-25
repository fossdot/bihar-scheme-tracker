import Link from "next/link";
import { localizedHref, t, type Locale } from "@/lib/i18n";

// Site-wide footer (rendered in the [lang] layout, so it appears on every public page —
// home, search, schemes, policies, map, about, detail pages). Attribution + quick links.
export function Footer({ locale }: { locale: Locale }) {
  const bodhya = (
    <a
      href="https://bodhya.net"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-brand hover:underline"
    >
      Bodhya ↗
    </a>
  );

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="font-semibold text-ink">{t(locale, "appName")}</div>
            <p className="mt-1">
              {locale === "hi" ? (
                <>{bodhya} के अंतर्गत विशाल आर्या की एक परियोजना।</>
              ) : (
                <>A project by Vishal Arya under {bodhya}.</>
              )}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={localizedHref(locale, "/about")} className="hover:text-ink">
              {t(locale, "navAbout")}
            </Link>
            <Link href={localizedHref(locale, "/rti")} className="hover:text-ink">
              {t(locale, "navRti")}
            </Link>
            <a href="/api/v1" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {t(locale, "footerApi")}
            </a>
            <a
              href="https://github.com/fossdot/bihar-scheme-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              {t(locale, "footerSource")}
            </a>
          </nav>
        </div>
        <p className="mt-6 text-xs">{t(locale, "footerNote")}</p>
      </div>
    </footer>
  );
}
