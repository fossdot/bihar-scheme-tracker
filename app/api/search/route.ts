import { NextRequest, NextResponse } from "next/server";
import { parseFilters } from "@/lib/facets";
import { isDbConfigured, searchSchemes } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** JSON finder endpoint for the live (as-you-type) search box + facets. */
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSchemes(parseFilters(req.nextUrl.searchParams));
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed.";
    return NextResponse.json({ results: [], error: message }, { status: 500 });
  }
}
