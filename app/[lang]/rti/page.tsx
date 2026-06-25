import type { Metadata } from "next";
import Link from "next/link";
import { ConfigNotice } from "@/components/ui";
import { altLinks, localizedHref, t, tryT } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { isDbConfigured, listRtiApplications, type RtiApplication } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "RTI ट्रैकर" : "RTI tracker",
    description:
      locale === "hi"
        ? "सूचना का अधिकार अधिनियम के तहत माँगे गए आँकड़े — दायर एवं प्रतीक्षारत आवेदनों की सूची।"
        : "Data requested under the Right to Information Act — filed and pending RTI applications.",
    alternates: altLinks(locale, "/rti"),
  };
}

// RTI lifecycle pill colour — mirrors the scheme detail page's provClass.
function provClass(p: string): string {
  if (p === "rti_received") return "text-brand ring-brand/40";
  if (p === "rti_filed") return "text-warn ring-warn/40";
  return "text-muted ring-line"; // rti_needed
}

export default async function RtiPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const configured = isDbConfigured();

  let rows: RtiApplication[] = [];
  if (configured) {
    try {
      rows = await listRtiApplications();
    } catch {
      rows = [];
    }
  }

  const filed = rows.filter((r) => r.provenance === "rti_filed").length;
  const received = rows.filter((r) => r.provenance === "rti_received").length;
  const needed = rows.filter((r) => r.provenance === "rti_needed").length;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t(locale, "rtiTitle")}</h1>
        <p className="max-w-2xl text-sm text-muted">{t(locale, "rtiSubtitle")}</p>
        {configured && rows.length > 0 && (
          <p className="pt-1 text-xs text-muted">
            {received} {tryT(locale, "prov_rti_received", "RTI received")} · {filed}{" "}
            {tryT(locale, "prov_rti_filed", "RTI filed")} · {needed}{" "}
            {tryT(locale, "prov_rti_needed", "RTI needed")}
          </p>
        )}
      </section>

      {!configured ? (
        <ConfigNotice />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t(locale, "rtiEmpty")}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">{t(locale, "rtiColScheme")}</th>
                <th className="px-3 py-2 font-medium">{t(locale, "rtiColData")}</th>
                <th className="px-3 py-2 font-medium">{t(locale, "rtiColStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const name = (locale === "hi" && r.scheme_name_hi) || r.scheme_name_en;
                return (
                  <tr key={`${r.scheme_id}-${i}`} className="border-b border-line last:border-0 align-top">
                    <td className="px-3 py-3">
                      <Link
                        href={localizedHref(locale, `/schemes/${r.scheme_id}`)}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-ink">{r.label ?? r.dimension}</div>
                      {r.note && <p className="mt-0.5 text-xs text-muted">{r.note}</p>}
                      {r.source_url && (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-block text-xs text-brand hover:underline"
                        >
                          {r.source_url.replace(/^https?:\/\//, "").slice(0, 48)}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${provClass(r.provenance)}`}
                      >
                        {tryT(locale, `prov_${r.provenance}`, r.provenance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
