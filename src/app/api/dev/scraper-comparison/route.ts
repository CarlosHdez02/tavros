import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Dev-only: serves the live scrape comparison report written by the platforms-scraper repo.
 * Override location with SCRAPER_COMPARISON_PATH.
 */
const REPORT_PATH =
  process.env.SCRAPER_COMPARISON_PATH ??
  path.resolve(process.cwd(), "../platforms-scraper/data/output/comparison_report.json");

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  try {
    const [raw, info] = await Promise.all([readFile(REPORT_PATH, "utf-8"), stat(REPORT_PATH)]);
    return NextResponse.json({
      path: REPORT_PATH,
      modifiedAt: info.mtime.toISOString(),
      report: JSON.parse(raw),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Comparison report not found or unreadable", path: REPORT_PATH, detail: message },
      { status: 404 },
    );
  }
}
