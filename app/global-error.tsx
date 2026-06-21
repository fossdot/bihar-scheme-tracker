"use client";

import { useEffect } from "react";
import "./globals.css";

// Catches errors thrown in the root layout itself. It replaces the whole document,
// so it renders its own <html>/<body> and can't rely on locale/theme context —
// hence a static bilingual message.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Something went wrong
          </h1>
          <p className="mt-1 text-lg text-ink">कुछ गड़बड़ हो गई</p>
          <p className="mt-3 text-sm text-muted">
            An unexpected error occurred. Please try again. · कृपया पुनः प्रयास करें।
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Try again
            </button>
            <a href="/" className="text-sm font-medium text-muted hover:text-ink">
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
