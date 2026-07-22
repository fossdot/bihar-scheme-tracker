import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewBeacon } from "@/components/ViewBeacon";
import { localizedHref, LOCALES, t, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  // Only per-locale SITE-WIDE og defaults here — NO url/title/description/canonical, or every
  // child page would inherit the homepage's (wrong og:url + og:title). Each page sets its own
  // alternates; og:title/description fall back to each page's title/description.
  return {
    openGraph: {
      type: "website",
      siteName: "Bihar Education Money",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      alternateLocale: locale === "hi" ? "en_IN" : "hi_IN",
    },
  };
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  // Defense in depth — middleware only ever passes /en or /hi through, but guard anyway.
  if (!(LOCALES as readonly string[]).includes(params.lang)) notFound();
  const locale = resolveLocale(params.lang) as Locale;

  return (
    <>
      {/* Skip link — first focusable element, visible only on keyboard focus (WCAG 2.4.1). */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-line focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
      >
        {t(locale, "skipToContent")}
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <div className="flex shrink-0 items-center gap-5">
            <Link
              href={localizedHref(locale, "/")}
              className="flex items-center gap-2 tracking-tight text-ink"
              aria-label={t(locale, "appName")}
            >
              <Logo className="h-7 w-7 shrink-0" />
              {/* Bilingual wordmark: the Devanagari brand mark always, English lockup on sm+. */}
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-semibold">शिक्षा का पैसा</span>
                <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-wide text-muted sm:block">
                  Bihar Education Money
                </span>
              </span>
            </Link>
            <Suspense fallback={null}>
              <SiteNav locale={locale} />
            </Suspense>
          </div>

          {/* Global search across schemes + policies (plain GET form — works without JS) */}
          <form action={localizedHref(locale, "/find")} method="get" role="search" className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              type="search"
              name="q"
              placeholder={t(locale, "searchAllPlaceholder")}
              aria-label={t(locale, "searchAllPlaceholder")}
              className="w-full rounded-md border border-line bg-surface py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand"
            />
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {/* LanguageToggle uses useSearchParams which requires Suspense in Next 14 App Router. */}
            <Suspense fallback={null}>
              <LanguageToggle locale={locale} />
            </Suspense>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 focus:outline-none">{children}</main>
      <Footer locale={locale} />
      <Suspense fallback={null}>
        <ViewBeacon />
      </Suspense>
    </>
  );
}
