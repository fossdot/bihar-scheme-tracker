"use client";

import { useEffect, useState } from "react";
import { animateValue } from "@/lib/animate";
import { CONVERSIONS, CONV_TOTAL_NOTE } from "@/lib/education-home";
import { pick, type Locale } from "@/lib/i18n";

// Make it tangible: the parked ₹14,738.13 cr translated into units a family recognises.
// The arithmetic is displayed under the number — trust is the product.

export function TangibleConverter({ locale }: { locale: Locale }) {
  const [key, setKey] = useState(CONVERSIONS[0].key);
  const [val, setVal] = useState(0);
  const c = CONVERSIONS.find((u) => u.key === key) ?? CONVERSIONS[0];

  useEffect(() => {
    return animateValue(0, c.n, 900, (v) => setVal(v));
  }, [c.n]);

  const shown = c.dec ? val.toFixed(c.dec) : Math.round(val).toLocaleString("en-IN");

  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <div role="group" aria-label={pick(locale, CONV_TOTAL_NOTE.en, CONV_TOTAL_NOTE.hi)} className="flex flex-wrap gap-2">
        {CONVERSIONS.map((u) => (
          <button
            key={u.key}
            type="button"
            aria-pressed={u.key === key}
            onClick={() => setKey(u.key)}
            className={`rounded-md border px-3.5 py-2 text-[13.5px] ${
              u.key === key
                ? "border-brand bg-brand/5 font-semibold text-ink"
                : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {pick(locale, u.btn.en, u.btn.hi)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-4xl font-bold leading-none tracking-tight tabular-nums text-ink sm:text-5xl">
          {c.pre ?? ""}
          {shown} <span className="text-[0.45em] font-semibold text-muted">{pick(locale, c.unit.en, c.unit.hi)}</span>
        </div>
        <p className="mt-2.5 max-w-xl text-[15px] text-ink">{pick(locale, c.what.en, c.what.hi)}</p>
        <div className="mt-3 inline-block rounded border border-dashed border-line bg-paper px-3 py-1.5 text-xs tabular-nums text-muted">
          {c.math}
        </div>
        <p className="mt-2 text-[11.5px] text-muted">{pick(locale, c.src.en, c.src.hi)}</p>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-muted">{pick(locale, CONV_TOTAL_NOTE.en, CONV_TOTAL_NOTE.hi)}</p>
    </div>
  );
}
