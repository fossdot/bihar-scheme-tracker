import { t, type Locale } from "@/lib/i18n";
import { extractUrl, isUnverified } from "@/lib/status";

/** A labelled detail row. Renders "—" for empty values, and for seeded TODO
 *  placeholders renders a "not yet verified" tag + a link to the source. */
export function Field({
  label,
  value,
  locale,
}: {
  label: string;
  value: string | null;
  locale: Locale;
}) {
  const unverified = isUnverified(value);
  const url = unverified ? extractUrl(value) : null;

  return (
    <div className="border-t border-line py-3">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-ink">
        {value == null || value === "" ? (
          <span className="text-muted">—</span>
        ) : unverified ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="rounded px-1.5 py-0.5 text-xs font-medium text-warn ring-1 ring-inset ring-warn/30">
              {t(locale, "notYetVerified")}
            </span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand underline underline-offset-2"
              >
                {t(locale, "verifyAtSource")}
              </a>
            )}
          </span>
        ) : (
          <span className="whitespace-pre-line">{value}</span>
        )}
      </dd>
    </div>
  );
}
