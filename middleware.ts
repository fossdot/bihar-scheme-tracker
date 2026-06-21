import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

// URL-based i18n. Every HTML page lives under /en or /hi.
//  - /en/* and /hi/*  → pass through, injecting an `x-locale` header so the neutral
//    root layout can stamp <html lang> per request (no second <html>, no inline hack).
//  - any bare path (incl. "/") → 308 to its /en equivalent, preserving the query string.
// The redirect is DETERMINISTIC — it never branches on a cookie or Accept-Language, so
// the Cloudflare/edge cache stays clean (Accept-Language "hi" is common on Indian
// browsers and would mis-route English readers). Locale choice persists via navigation.

// Paths that must never be locale-prefixed or redirected (route handlers + SEO/asset
// files). Belt-and-suspenders alongside config.matcher below.
const EXCLUDED = /^\/(?:api|health|_next|sitemap\.xml|robots\.txt|opengraph-image|icon\.svg|favicon\.ico)(?:\/|$)/;

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (EXCLUDED.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1];
  if ((LOCALES as readonly string[]).includes(seg)) {
    const headers = new Headers(req.headers);
    headers.set("x-locale", seg);
    return NextResponse.next({ request: { headers } });
  }

  const dest = new URL(`/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}${search}`, req.url);
  const res = NextResponse.redirect(dest, 308);
  // The bare→/en mapping is deterministic + permanent, so let browsers and the CDN cache
  // it instead of hitting the origin for the redirect on every fresh entry.
  res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return res;
}

export const config = {
  // Run on everything except Next internals, asset files, and the excluded route
  // handlers / SEO files (also guarded inside the function above).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|api|health|sitemap.xml|robots.txt|opengraph-image).*)",
  ],
};
