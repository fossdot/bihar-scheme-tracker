import type { Metadata } from "next";
import { AdminClient } from "@/components/AdminClient";

// Data-free shell — identical for every visitor, so it's safe for the CDN to cache. All auth
// state + analytics data come from the uncached /api/admin endpoint (fetched client-side),
// which is why no Cloudflare cache rule is needed to protect this page.
export const metadata: Metadata = {
  title: "Admin · analytics",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminClient />
    </div>
  );
}
