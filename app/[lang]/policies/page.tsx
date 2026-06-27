import type { Metadata } from "next";
import { PoliciesArt } from "@/components/PoliciesArt";
import { PolicyExplore } from "@/components/PolicyExplore";
import { ConfigNotice } from "@/components/ui";
import { altLinks, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { isDbConfigured, listPolicies } from "@/lib/queries";
import type { PolicyListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "नीतियाँ" : "Policies",
    description:
      locale === "hi"
        ? "बिहार सरकार की नीतियाँ, अधिनियम, मिशन व ढाँचे — निकाली गई स्थिति और टिप्पणी हेतु खुले सार्वजनिक-परामर्श प्रारूपों सहित।"
        : "Bihar government policies, acts, missions and frameworks — with derived status and public-consultation drafts open for comment.",
    alternates: altLinks(locale, "/policies"),
  };
}

export default async function PoliciesPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = resolveLocale(params.lang);
  const configured = isDbConfigured();
  const initialView = typeof searchParams.view === "string" ? searchParams.view : "";
  const initialCat = typeof searchParams.sector === "string" ? searchParams.sector : "";

  let policies: PolicyListItem[] = [];
  if (configured) {
    try {
      policies = await listPolicies({});
    } catch {
      policies = [];
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center md:gap-5">
        <PoliciesArt className="h-auto w-[132px] shrink-0 text-ink" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t(locale, "policiesTitle")}
          </h1>
          <p className="text-sm text-muted">{t(locale, "policiesSubtitle")}</p>
        </div>
      </section>

      {!configured ? (
        <ConfigNotice />
      ) : (
        <PolicyExplore
          locale={locale}
          today={todayISO()}
          policies={policies}
          initialView={initialView}
          initialCat={initialCat}
        />
      )}
    </div>
  );
}
