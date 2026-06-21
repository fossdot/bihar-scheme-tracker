import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/queries";

export const dynamic = "force-dynamic";

const BASE = "https://yojana.bodhya.net";

// One entry per page/entity, with the /en URL as primary and reciprocal en/hi
// alternates (Next renders these as <xhtml:link hreflang=…>). /find is omitted (noindex).
function entry(
  path: string,
  opts: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {}
): MetadataRoute.Sitemap[number] {
  const en = `${BASE}/en${path}`;
  const hi = `${BASE}/hi${path}`;
  return { url: en, alternates: { languages: { en, hi } }, ...opts };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    entry("", { changeFrequency: "weekly", priority: 1 }),
    entry("/search", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/policies", { changeFrequency: "weekly", priority: 0.7 }),
    entry("/find-my-schemes", { changeFrequency: "monthly", priority: 0.6 }),
    entry("/map", { changeFrequency: "monthly", priority: 0.5 }),
    entry("/about", { changeFrequency: "monthly", priority: 0.4 }),
  ];
  if (!isDbConfigured()) return staticPages;
  try {
    // Every scheme/policy — not the finder's top-50, so the sitemap is complete.
    const [schemes, policies] = await Promise.all([
      query<{ id: string; last_verified: string | null }>(`select id, last_verified from schemes order by name_en`),
      query<{ id: string }>(`select id from policies order by name_en`),
    ]);
    const schemeUrls: MetadataRoute.Sitemap = schemes.map((s) =>
      entry(`/schemes/${s.id}`, {
        lastModified: s.last_verified ? new Date(s.last_verified) : undefined,
        changeFrequency: "monthly",
        priority: 0.8,
      })
    );
    const policyUrls: MetadataRoute.Sitemap = policies.map((p) =>
      entry(`/policies/${p.id}`, { changeFrequency: "monthly", priority: 0.6 })
    );
    return [...staticPages, ...schemeUrls, ...policyUrls];
  } catch {
    return staticPages;
  }
}
