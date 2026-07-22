import type { Metadata } from "next";
import "./globals.css";
import { getLocaleFromHeaders } from "@/lib/locale";

const SITE_URL = "https://yojana.bodhya.net";

// Applied before first paint so the chosen theme shows with no flash AND the server HTML stays
// theme-agnostic (identical for light/dark) — that's what lets Cloudflare edge-cache every page
// for all visitors, including returning users who picked a theme. Reads the `theme` cookie that
// ThemeToggle writes. Inline + tiny so it blocks for <1ms; allowed by CSP ('unsafe-inline').
const THEME_INIT = `try{if(("; "+document.cookie).indexOf("; theme=dark")>-1){document.documentElement.classList.add("dark")}}catch(e){}`;

// Locale-NEUTRAL root metadata. Per-locale canonical / hreflang / openGraph.url +
// locale live in app/[lang]/layout.tsx and each page's generateMetadata.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bihar Education Money — Where Bihar’s education money goes",
    template: "%s · Bihar Education Money",
  },
  description:
    "Follow the money meant to educate Bihar’s children — from what the state released, to what it can be shown to have actually spent. Bihar is India’s poorest state; every figure here is source-verified, and where nothing is published, an RTI is the trail.",
  applicationName: "Bihar Education Money",
  keywords: [
    "Bihar education budget",
    "Bihar education money",
    "Samagra Shiksha Bihar",
    "Bihar education spending",
    "Bihar school funds unspent",
    "CAG Bihar education audit",
    "Bihar dropout rate",
    "shiksha ka paisa",
    "Bihar government schemes",
    "Bihar scholarship",
    "बिहार शिक्षा बजट",
    "शिक्षा का पैसा",
  ],
  authors: [{ name: "FOSS United", url: "https://fossunited.org" }],
  twitter: {
    card: "summary_large_image",
    title: "Bihar Education Money — Where Bihar’s education money goes",
    description:
      "Bihar releases the money; it can’t show it reached a single child. Follow the funds, the dropouts, and the audit findings — every figure sourced.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// The ONLY <html>/<body> in the app (Next requires the root layout to own them; a
// second <html> in [lang]/layout is illegal). `lang` comes from the middleware-injected
// x-locale header so SSR markup carries the right language without an inline-script hack.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocaleFromHeaders();
  // No theme class on <html> at SSR — the inline script below applies it client-side before
  // paint, keeping the markup identical regardless of theme. suppressHydrationWarning silences
  // the expected <html> className diff (script runs before React hydrates).
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
