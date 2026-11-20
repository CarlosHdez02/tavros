import { NextResponse } from "next/server";
import { handleTelemetry } from "@/server/tvTelemetry";

/** TV health reports from the display → server logs + Slack (see server/tvTelemetry.ts). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }
  const result = await handleTelemetry(body);
  return NextResponse.json(result.body, { status: result.status });
}
