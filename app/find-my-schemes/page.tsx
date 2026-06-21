import Link from "next/link";
import { GuidedFinder } from "@/components/GuidedFinder";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find schemes for you",
  description:
    "Answer a few questions about yourself and see the Bihar & central government schemes you likely qualify for — with status, benefits, and official apply links.",
  alternates: { canonical: "/find-my-schemes" },
};

export default function FindMySchemesPage() {
  const locale = getLocale();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t(locale, "guidedTitle")}</h1>
        <p className="text-muted">{t(locale, "findIntro")}</p>
        <p className="text-sm text-muted">
          {t(locale, "orBrowse")}{" "}
          <Link href="/search" className="font-medium text-brand hover:underline">
            {t(locale, "browseAll")}
          </Link>
        </p>
      </header>
      <GuidedFinder locale={locale} />
    </div>
  );
}
