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
