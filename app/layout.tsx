import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/locale";

const SITE_URL = "https://yojana.bodhya.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bihar Scheme Tracker — Find government schemes you qualify for",
    template: "%s · Bihar Scheme Tracker",
  },
  description:
    "Tell us who you are and find the Bihar & central government schemes you're likely eligible for — each with its real status, eligibility, benefit, and official apply link. Source-verified and evidence-based, never guessed.",
  applicationName: "Bihar Scheme Tracker",
  keywords: [
    "Bihar schemes",
    "Bihar yojana",
    "sarkari yojana",
    "government schemes Bihar",
    "scholarship Bihar",
    "pension Bihar",
    "Bihar Student Credit Card",
    "Mukhyamantri Kanya Utthan Yojana",
    "scheme eligibility",
    "apply online Bihar",
    "बिहार योजना",
    "सरकारी योजना",
  ],
  authors: [{ name: "FOSS United", url: "https://fossunited.org" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Bihar Scheme Tracker",
    url: SITE_URL,
    locale: "en_IN",
    title: "Bihar Scheme Tracker — Find government schemes you qualify for",
    description:
      "Discover the Bihar & central government schemes you're eligible for — with real status, eligibility, benefits, and official apply links. Source-verified, evidence-based.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bihar Scheme Tracker — Find schemes you qualify for",
    description:
      "Find the Bihar & central government schemes you're eligible for — source-verified status, eligibility, benefits, and official apply links.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
