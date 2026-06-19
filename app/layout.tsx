import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Bihar Scheme Tracker",
  description:
    "A source-backed catalogue of Bihar government policies and schemes, with evidence-based status.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const theme = getTheme();
  return (
    <html lang={locale} className={theme === "dark" ? "dark" : undefined}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <div className="flex shrink-0 items-center gap-5">
              <Link
                href="/"
                className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
              >
                <Logo className="h-7 w-7 shrink-0" />
                <span className="hidden sm:inline">{t(locale, "appName")}</span>
                <span className="sm:hidden">{locale === "hi" ? "योजना ट्रैकर" : "Tracker"}</span>
              </Link>
              <nav className="hidden items-center gap-5 text-sm md:flex">
                <Link href="/search" className="text-muted hover:text-ink">
                  {t(locale, "navSchemes")}
                </Link>
                <Link href="/policies" className="text-muted hover:text-ink">
                  {t(locale, "navPolicies")}
                </Link>
                <Link href="/map" className="text-muted hover:text-ink">
                  {t(locale, "navMap")}
                </Link>
                <Link href="/about" className="text-muted hover:text-ink">
                  {t(locale, "navAbout")}
                </Link>
              </nav>
            </div>

            {/* Global search across schemes + policies (plain GET form — works without JS) */}
            <form action="/find" method="get" role="search" className="relative min-w-0 flex-1">
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
      </body>
    </html>
  );
}
