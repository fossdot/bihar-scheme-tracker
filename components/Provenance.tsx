"use client";

import { useEffect } from "react";
import { tryT, type Locale } from "@/lib/i18n";
import { hostLabel } from "@/lib/status";

// Shared provenance popover — the "says who?" layer (Shneiderman: details on demand).
// Consumers keep a `PopState | null` in state, open it from any trigger via `popFrom`,
// and render <ProvPopover/> inside their own `position: relative` container.

export interface ProvInfo {
  title: string;
  value?: string;
  doc?: string;
  prov?: string; // provenance slug → prov_* i18n key
  src?: string; // source URL
}

export interface PopState {
  info: ProvInfo;
  x: number; // px, relative to the container
  y: number;
}

export function provChipClass(p: string | null | undefined): string {
  if (p === "published" || p === "rti_received") return "text-brand-strong ring-brand/40";
  if (p === "reported" || p === "rti_filed") return "text-warn ring-warn/40";
  return "text-muted ring-line";
}

/** Compute a PopState from a click, positioned under the trigger and clamped to the container. */
export function popFrom(e: React.MouseEvent<HTMLElement>, container: HTMLElement | null, info: ProvInfo): PopState {
  const btn = e.currentTarget as HTMLElement;
  const c = container ?? document.body;
  const br = btn.getBoundingClientRect();
  const cr = c.getBoundingClientRect();
  const half = 140; // popover is w-[280px]; clamp its centre inside the container
  let x = br.left - cr.left + br.width / 2;
  x = Math.max(Math.min(x, cr.width - half - 4), half + 4);
  if (cr.width < 296) x = cr.width / 2;
  return { info, x, y: br.bottom - cr.top + 8 };
}

export function ProvPopover({ pop, locale, onClose }: { pop: PopState | null; locale: Locale; onClose: () => void }) {
  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-provpop]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [pop, onClose]);

  if (!pop) return null;
  const { info } = pop;
  return (
    <div
      data-provpop
      role="dialog"
      aria-label={info.title}
      className="absolute z-40 w-[min(280px,88vw)] -translate-x-1/2 rounded-md border border-line bg-surface p-3 text-xs"
      style={{ left: pop.x, top: pop.y }}
    >
      <div className="font-semibold text-ink">{info.title}</div>
      {info.value && <div className="mt-0.5 text-base font-bold tabular-nums text-ink">{info.value}</div>}
      {info.doc && <div className="mt-1 text-muted">{info.doc}</div>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {info.prov && (
          <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${provChipClass(info.prov)}`}>
            {tryT(locale, `prov_${info.prov}`, info.prov)}
          </span>
        )}
        {info.src && (
          <a href={info.src} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-strong underline underline-offset-2">
            {hostLabel(info.src)} ↗
          </a>
        )}
      </div>
    </div>
  );
}
