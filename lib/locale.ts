// Server-only module (imports next/headers). Do not import from client components.
import { headers, cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n";

/** Validate a URL `[lang]` segment into a Locale, defaulting to English for anything
 *  unknown. This is the primary locale source — pages read it from their route params. */
export function resolveLocale(lang: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(lang ?? "")
    ? (lang as Locale)
    : DEFAULT_LOCALE;
}

/** Read the locale from the `x-locale` request header that middleware injects for
 *  /en and /hi paths. Only for files that have NO route params: the neutral root
 *  layout (to stamp <html lang>) and the in-segment not-found. */
export function getLocaleFromHeaders(): Locale {
  return resolveLocale(headers().get("x-locale") ?? undefined);
}

export const THEME_COOKIE = "theme";
export type Theme = "light" | "dark";

/** Read the colour theme from the cookie (default light). Set on <html> at SSR so there's
 *  no flash and no hydration mismatch. (Theme stays cookie-based; only locale moved to URL.) */
export function getTheme(): Theme {
  return cookies().get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
