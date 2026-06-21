import type { Metadata } from "next";
import Link from "next/link";
import { GuidedFinder } from "@/components/GuidedFinder";
import { altLinks, localizedHref, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "अपने लिए योजनाएँ खोजें" : "Find schemes for you",
    description:
      locale === "hi"
        ? "अपने बारे में कुछ सवालों के जवाब दें और देखें कि आप बिहार व केंद्र सरकार की किन योजनाओं के लिए पात्र हैं — स्थिति, लाभ और आधिकारिक आवेदन लिंक सहित।"
        : "Answer a few questions about yourself and see the Bihar & central government schemes you likely qualify for — with status, benefits, and official apply links.",
    alternates: altLinks(locale, "/find-my-schemes"),
  };
}

export default function FindMySchemesPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t(locale, "guidedTitle")}</h1>
        <p className="text-muted">{t(locale, "findIntro")}</p>
        <p className="text-sm text-muted">
          {t(locale, "orBrowse")}{" "}
          <Link href={localizedHref(locale, "/search")} className="font-medium text-brand hover:underline">
            {t(locale, "browseAll")}
          </Link>
        </p>
      </header>
      <GuidedFinder locale={locale} />
    </div>
  );
}
