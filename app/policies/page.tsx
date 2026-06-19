import { PolicyExplore } from "@/components/PolicyExplore";
import { ConfigNotice } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { isDbConfigured, listPolicies } from "@/lib/queries";
import type { PolicyListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const locale = getLocale();
  const configured = isDbConfigured();

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
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t(locale, "policiesTitle")}
        </h1>
        <p className="text-sm text-muted">{t(locale, "policiesSubtitle")}</p>
      </section>

      {!configured ? (
        <ConfigNotice />
      ) : (
        <PolicyExplore locale={locale} today={todayISO()} policies={policies} />
      )}
    </div>
  );
}
