import { Icon } from "@/components/Icon";

const REPO = "https://github.com/fossdot/bihar-scheme-tracker";

/** Links to the prefilled "report incorrect info" GitHub issue form — turns a reader who
 *  spots a stale figure into a contribution. Entity name prefills the form. */
export function FeedbackLink({ entity, label }: { entity: string; label: string }) {
  const url =
    `${REPO}/issues/new?template=report-incorrect-info.yml` +
    `&title=${encodeURIComponent(`[Data] ${entity}`)}` +
    `&scheme=${encodeURIComponent(entity)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
    >
      <Icon name="info" className="h-4 w-4" />
      {label}
    </a>
  );
}
