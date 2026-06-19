import Link from "next/link";
import { Icon } from "@/components/Icon";

export type SidebarItem = {
  id: string;
  href: string;
  name: string;
  badge?: React.ReactNode;
};

/** A compact right-rail panel of related entities (similar schemes / schemes under a policy /
 *  related policies). Name stacked over a quiet status badge — readable in a narrow column. */
export function SidebarList({
  title,
  icon,
  items,
}: {
  title: string;
  icon?: string;
  items: SidebarItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="overflow-hidden rounded-md border border-line bg-surface">
      <h2 className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">
        {icon && <Icon name={icon} className="h-4 w-4 shrink-0 text-muted" />}
        {title}
      </h2>
      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="block px-4 py-3 hover:bg-paper">
              <span className="block text-sm font-medium text-ink">{it.name}</span>
              {it.badge && <span className="mt-1.5 block">{it.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
