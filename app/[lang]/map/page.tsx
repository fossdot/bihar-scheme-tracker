import { notFound } from "next/navigation";

// Map page hidden for now — not linked in nav and removed from the sitemap; direct access 404s.
// (The full scheme–policy map implementation is preserved in git history when we bring it back.)
export const dynamic = "force-dynamic";

export default function MapPage() {
  notFound();
}
