import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://yojana.bodhya.net/sitemap.xml",
    host: "https://yojana.bodhya.net",
  };
}
