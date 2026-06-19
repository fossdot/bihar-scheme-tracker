// Server-only module (imports next/headers). Do not import from client components.
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./i18n";

/** Read the active locale from the cookie in a server component. Defaults to English.
 *  Reading cookies opts the page into dynamic rendering — fine here (data app). */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "hi" ? "hi" : DEFAULT_LOCALE;
}

export const THEME_COOKIE = "theme";
export type Theme = "light" | "dark";

/** Read the colour theme from the cookie (default light). Set on <html> at SSR so there's
 *  no flash and no hydration mismatch. */
export function getTheme(): Theme {
  return cookies().get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
