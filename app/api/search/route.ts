import { NextRequest, NextResponse } from "next/server";
import { parseFilters } from "@/lib/facets";
import { isDbConfigured, searchSchemes } from "@/lib/queries";
import { logSearch } from "@/lib/searchlog";

export const dynamic = "force-dynamic";

/** JSON finder endpoint for the live (as-you-type) search box + facets. */
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ results: [] });
  }
  try {
    const filters = parseFilters(req.nextUrl.searchParams);
    const results = await searchSchemes(filters);
    const surface = req.nextUrl.searchParams.get("surface") === "guided" ? "guided" : "finder";
    logSearch({ surface, q: filters.q, filters, resultCount: results.length });
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed.";
    return NextResponse.json({ results: [], error: message }, { status: 500 });
  }
}
