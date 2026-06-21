import Link from "next/link";

// Root 404 — renders in the locale-neutral root layout for top-level paths that match no
// route and aren't under /en|/hi (rare; middleware 308s most bare paths to /en). It has no
// locale source, so it's static bilingual. Locale-aware 404s live in app/[lang]/not-found.tsx.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        Page not found
      </h1>
      <p className="mt-1 text-lg text-ink">पृष्ठ नहीं मिला</p>
      <p className="mt-3 text-sm text-muted">
        This page doesn&apos;t exist. · यह पृष्ठ मौजूद नहीं है।
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to home · होम पर लौटें
      </Link>
    </div>
  );
}
