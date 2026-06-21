import { NextResponse } from "next/server";

// Shared helpers for the public, read-only JSON API (/api/v1/*). CORS-open (it's public data),
// bilingual (each record carries _en/_hi), and every record keeps its source_url.
const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type",
};

export function apiJson(data: unknown, opts: { status?: number; cache?: boolean } = {}): NextResponse {
  return NextResponse.json(data, {
    status: opts.status ?? 200,
    headers: {
      ...CORS,
      // Read-only public data → cacheable by clients/proxies (5 min). Edge caching depends on
      // the CDN rules; this just lets well-behaved consumers cache.
      "cache-control": opts.cache === false ? "no-store" : "public, max-age=300, s-maxage=300",
    },
  });
}

export const apiError = (status: number, message: string) => apiJson({ error: message }, { status, cache: false });

export const preflight = () => new NextResponse(null, { status: 204, headers: CORS });

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const isUuid = (s: string) => UUID.test(s);

// Drop internal/heavy columns (the embedding vector + generated full-text columns) so the API
// never ships them.
export function publicRow<T extends Record<string, any>>(row: T): T {
  const { embedding, search_tsv, search_text, ...rest } = row;
  return rest as T;
}
