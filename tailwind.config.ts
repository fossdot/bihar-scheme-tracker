import type { Config } from "tailwindcss";

// Colours are driven by CSS variables (RGB channel triplets) defined in globals.css, so the
// SAME utility classes work in light and dark — the `.dark` class on <html> flips the values.
// The `rgb(var(--x) / <alpha-value>)` form keeps Tailwind opacity modifiers (e.g. ring-brand/40).
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // lib/status.ts holds full badge/dot class strings — scan it so they aren't purged.
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minimal black-and-white base. FOSS United green is the single accent — used
        // sparingly for primary buttons, links, and active/selected states (never as a
        // decorative fill). Hierarchy comes from weight + size, not colour.
        bg: v("--bg"), // page background
        surface: v("--surface"), // cards, header, inputs
        ink: v("--ink"), // primary text
        muted: v("--muted"), // secondary text
        line: v("--line"), // 1px borders & dividers
        paper: v("--paper"), // subtle inset surface (table headers, code, insets)
        brand: {
          DEFAULT: v("--brand"), // FOSS United green
          dark: v("--brand-dark"), // hover / pressed
        },
        danger: v("--danger"), // destructive actions & errors
        warn: v("--warn"), // warnings (amber)
      },
      borderColor: {
        DEFAULT: v("--line"),
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans",
          "Noto Sans Devanagari",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
