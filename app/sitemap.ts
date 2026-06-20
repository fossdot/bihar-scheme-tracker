import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { isDbConfigured } from "@/lib/queries";

export const dynamic = "force-dynamic";

const BASE = "https://yojana.bodhya.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/policies`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/map`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];
  if (!isDbConfigured()) return staticPages;
  try {
    // Every scheme/policy — not the finder's top-50, so the sitemap is complete.
    const [schemes, policies] = await Promise.all([
      query<{ id: string; last_verified: string | null }>(`select id, last_verified from schemes order by name_en`),
      query<{ id: string }>(`select id from policies order by name_en`),
    ]);
    const schemeUrls: MetadataRoute.Sitemap = schemes.map((s) => ({
      url: `${BASE}/schemes/${s.id}`,
      lastModified: s.last_verified ? new Date(s.last_verified) : undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
    const policyUrls: MetadataRoute.Sitemap = policies.map((p) => ({
      url: `${BASE}/policies/${p.id}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
    return [...staticPages, ...schemeUrls, ...policyUrls];
  } catch {
    return staticPages;
  }
}
