"use client";

import { useState } from "react";
import { animateValue } from "@/lib/animate";
import { GUESS } from "@/lib/education-home";
import { pick, t, type Locale } from "@/lib/i18n";

// Guess-first widgets (the NYT "You Draw It" mechanic): the reader commits to a guess,
// then watches it drain to the real figure. The wrongness is the message.

const fmtIN = (n: number) => Math.round(n).toLocaleString("en-IN");
const fill = (tpl: string, tokens: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? "");

/** 100-children dot grid: how many reach secondary school? (home page) */
export function GuessTransition({ locale }: { locale: Locale }) {
  const [guess, setGuess] = useState(50);
  const [shown, setShown] = useState(50); // dots currently lit
  const [revealed, setRevealed] = useState(false);
  const g = GUESS.children;

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    animateValue(guess, g.truthDots, 1100, (v) => setShown(v));
  };

  const diff = Math.abs(guess - g.truth);
  const verdictLine = fill(pick(locale, diff <= 8 ? g.close.en : g.off.en, diff <= 8 ? g.close.hi : g.off.hi), {
    g: String(guess),
    d: fmtIN(diff),
  });

  return (
    <div>
      <div className="kid-dots" aria-hidden="true">
        {Array.from({ length: 100 }).map((_, i) => (
          <span key={i} className={`kid-dot ${i < Math.round(shown) ? "on" : ""}`} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="min-w-[2.4ch] text-2xl font-bold tabular-nums text-ink">{Math.round(shown)}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={guess}
          disabled={revealed}
          onChange={(e) => {
            const v = +e.target.value;
            setGuess(v);
            setShown(v);
          }}
          aria-label={pick(locale, GUESS.children.biharStat.en, GUESS.children.biharStat.hi)}
          aria-valuetext={`${guess} / 100`}
          className="range-brand w-[min(340px,100%)]"
        />
        <button
          type="button"
          onClick={reveal}
          disabled={revealed}
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-default disabled:opacity-45"
        >
          {t(locale, "guessReveal")}
        </button>
      </div>

      <div aria-live="polite" className="mt-4 min-h-[1.5em] max-w-2xl text-[15px] text-ink">
        {revealed && (
          <>
            {pick(locale, GUESS.reality.en, GUESS.reality.hi)}{" "}
            <b className="tabular-nums text-warn">{pick(locale, g.realityVal.en, g.realityVal.hi)}</b>. {verdictLine}
            <span className="mt-1 block text-sm text-muted">{pick(locale, g.india.en, g.india.hi)}</span>
          </>
        )}
      </div>

      {revealed && (
        <div className="mt-5 flex flex-wrap gap-8 text-sm text-muted">
          <span>
            <b className="block text-2xl font-bold tabular-nums text-warn">31.5%</b>
            {pick(locale, g.biharStat.en, g.biharStat.hi)}
          </span>
          <span>
            <b className="block text-2xl font-bold tabular-nums text-muted">83.3%</b>
            {pick(locale, g.indiaStat.en, g.indiaStat.hi)}
          </span>
        </div>
      )}
    </div>
  );
}

/** ₹ slider: of the ₹16,407 cr withdrawn, how much was verified reaching a student? (/programmes) */
export function GuessVerified({ locale }: { locale: Locale }) {
  const g = GUESS.verified;
  const [guess, setGuess] = useState(8000);
  const [shown, setShown] = useState(8000);
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    animateValue(guess, 0, 1300, (v) => setShown(v));
  };

  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="max-w-2xl text-[15px] text-ink">{pick(locale, g.lede.en, g.lede.hi)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">₹{fmtIN(shown)} cr</span>
        <input
          type="range"
          min={0}
          max={g.max}
          step={100}
          value={revealed ? Math.round(shown) : guess}
          disabled={revealed}
          onChange={(e) => {
            const v = +e.target.value;
            setGuess(v);
            setShown(v);
          }}
          aria-label={pick(locale, g.lede.en, g.lede.hi)}
          aria-valuetext={`₹${fmtIN(guess)} crore`}
          className="range-brand w-[min(340px,100%)]"
        />
        <button
          type="button"
          onClick={reveal}
          disabled={revealed}
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-default disabled:opacity-45"
        >
          {t(locale, "guessReveal")}
        </button>
      </div>

      <div aria-live="polite" className="mt-4 min-h-[1.5em] max-w-2xl text-[15px] text-ink">
        {revealed && (
          <>
            {pick(locale, GUESS.reality.en, GUESS.reality.hi)} <b className="tabular-nums text-warn">₹0</b>.{" "}
            {pick(locale, g.reality.en, g.reality.hi)}
            <span className="mt-1 block text-sm text-muted">
              {guess > 0
                ? fill(pick(locale, g.credit.en, g.credit.hi), { g: fmtIN(guess) })
                : pick(locale, g.nailed.en, g.nailed.hi)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
