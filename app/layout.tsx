import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
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
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-base font-semibold tracking-tight text-ink"
              >
                {t(locale, "appName")}
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                <Link href="/search" className="text-muted hover:text-ink">
                  {t(locale, "navSchemes")}
                </Link>
                <Link href="/policies" className="text-muted hover:text-ink">
                  {t(locale, "navPolicies")}
                </Link>
                <Link href="/about" className="hidden text-muted hover:text-ink sm:inline">
                  {t(locale, "navAbout")}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
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
