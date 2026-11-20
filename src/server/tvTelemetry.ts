import { z } from "zod";
import { postAlert } from "@/server/slackAlert";

/**
 * Receives TV health reports from the display (see utils/tvHealth.ts), writes
 * them to the server logs and alerts Slack for the ones that mean the TV went
 * blank. The Slack text is built here from validated numbers only — the
 * endpoint is public, so nothing the client sends is echoed as free text.
 */

const TIMEZONE = process.env.TIMEZONE || "America/Mexico_City";
/** At most one Slack message per event type in this window (per server instance). */
const SLACK_MIN_INTERVAL_MS = 5 * 60 * 1000;

const mb = z.number().finite().min(0).max(1_000_000).nullable();

const reportSchema = z.object({
  event: z.enum([
    "likely_oom",
    "unexpected_restart",
    "probably_switched_off",
    "memory_high",
  ]),
  lastBeatAt: z.number().finite().positive(),
  uptimeMin: z.number().finite().min(0).max(10_000_000),
  downMin: z.number().finite().min(0).max(10_000_000),
  heapStartMB: mb,
  heapLastMB: mb,
  heapPeakMB: mb,
  heapLimitMB: mb,
});

export type TelemetryReport = z.infer<typeof reportSchema>;

const lastSlackAt = new Map<string, number>();

export const __resetTelemetryRateLimitForTests = () => lastSlackAt.clear();

const formatDuration = (minutes: number) => {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
};

const formatTime = (epochMs: number) =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(epochMs));

function memorySentence(r: TelemetryReport): string {
  const used = r.heapPeakMB ?? r.heapLastMB;
  if (used == null || r.heapLimitMB == null || r.heapLimitMB <= 0) {
    return "Memory readings are not available on this browser.";
  }
  const pct = Math.round((used / r.heapLimitMB) * 100);
  const start =
    r.heapStartMB != null ? `, up from ${r.heapStartMB} MB at start` : "";
  return `Memory peaked at ${used} of ${r.heapLimitMB} MB (${pct}%)${start}.`;
}

/** Returns the Slack text, or null when the event is only worth a log line. */
export function buildAlertText(r: TelemetryReport): string | null {
  const stopped = `It stopped at ${formatTime(r.lastBeatAt)} after running ${formatDuration(r.uptimeMin)} and came back ${formatDuration(r.downMin)} later.`;
  switch (r.event) {
    case "likely_oom":
      return `The TV display probably ran out of memory. ${stopped} ${memorySentence(r)}`;
    case "unexpected_restart":
      return `The TV display stopped unexpectedly (crash or blank screen, then a manual reload). ${stopped} ${memorySentence(r)}`;
    case "memory_high":
      return `The TV display is close to running out of memory after ${formatDuration(r.uptimeMin)}; it is refreshing itself to avoid a crash. ${memorySentence(r)}`;
    case "probably_switched_off":
      // Long gap with normal memory: the TV was turned off. Not an alert.
      return null;
  }
}

/** Validates, logs and (when warranted) alerts. Never throws. */
export async function handleTelemetry(
  body: unknown,
): Promise<{
  status: number;
  body: { ok: boolean; alerted?: boolean; error?: string };
}> {
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { ok: false, error: "invalid report" } };
  }
  const report = parsed.data;

  // Always visible in the hosting logs, even without Slack
  console.log("tv_health_report", JSON.stringify(report));

  const text = buildAlertText(report);
  let alerted = false;
  if (text) {
    const now = Date.now();
    const last = lastSlackAt.get(report.event) ?? 0;
    if (now - last >= SLACK_MIN_INTERVAL_MS) {
      alerted = await postAlert(text);
      if (alerted) lastSlackAt.set(report.event, now);
    }
  }
  return { status: 200, body: { ok: true, alerted } };
}
