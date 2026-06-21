import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { altLinks, localizedHref, LOCALES, t, type Locale } from "@/lib/i18n";
import { getTheme, resolveLocale } from "@/lib/locale";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    alternates: altLinks(locale, "/"),
    openGraph: {
      type: "website",
      siteName: "Bihar Scheme Tracker",
      url: localizedHref(locale, "/"),
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      alternateLocale: locale === "hi" ? "en_IN" : "hi_IN",
      title:
        locale === "hi"
          ? "बिहार योजना ट्रैकर — अपने लिए सरकारी योजनाएँ खोजें"
          : "Bihar Scheme Tracker — Find government schemes you qualify for",
      description:
        locale === "hi"
          ? "बताइए आप कौन हैं और बिहार व केंद्र सरकार की वे योजनाएँ पाइए जिनके लिए आप पात्र हैं — हर एक की वास्तविक स्थिति, पात्रता, लाभ और आधिकारिक लिंक के साथ।"
          : "Discover the Bihar & central government schemes you're eligible for — with real status, eligibility, benefits, and official apply links. Source-verified, evidence-based.",
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
  const theme = getTheme();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <div className="flex shrink-0 items-center gap-5">
            <Link
              href={localizedHref(locale, "/")}
              className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
            >
              <Logo className="h-7 w-7 shrink-0" />
              <span className="hidden sm:inline">{t(locale, "appName")}</span>
              <span className="sm:hidden">{locale === "hi" ? "योजना ट्रैकर" : "Tracker"}</span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <Link href={localizedHref(locale, "/search")} className="text-muted hover:text-ink">
                {t(locale, "navSchemes")}
              </Link>
              <Link href={localizedHref(locale, "/policies")} className="text-muted hover:text-ink">
                {t(locale, "navPolicies")}
              </Link>
              <Link href={localizedHref(locale, "/map")} className="text-muted hover:text-ink">
                {t(locale, "navMap")}
              </Link>
              <Link href={localizedHref(locale, "/about")} className="text-muted hover:text-ink">
                {t(locale, "navAbout")}
              </Link>
            </nav>
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
            <ThemeToggle initial={theme} />
            <LanguageToggle locale={locale} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
