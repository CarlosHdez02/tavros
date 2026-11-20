/**
 * TV health monitor.
 *
 * When the TV browser runs out of memory it kills the tab instantly — the page
 * cannot report anything at that moment. So while the page is alive it keeps a
 * small "heartbeat" record in localStorage, and marks it as a clean exit when
 * the page closes normally (reloads, navigation). On the next load, a record
 * WITHOUT that mark means the previous session died unexpectedly; we report it
 * to /api/telemetry, which alerts Slack (via Pip).
 */
import { safeReload } from "@/utils/recovery";

export const HEALTH_STORAGE_KEY = "tavros:tvHealth";
export const HEARTBEAT_INTERVAL_MS = 30_000;
/** JS heap usage at or above this share of the browser's limit counts as "about to crash". */
export const HIGH_HEAP_RATIO = 0.8;
/**
 * A dead session that is reloaded within this window was almost certainly a
 * crash someone had to fix by hand. A longer gap with normal memory is treated
 * as the TV simply having been switched off (not alerted).
 */
export const QUICK_RESTART_MS = 60 * 60 * 1000;

export type TvHealthEvent =
  | "likely_oom"
  | "unexpected_restart"
  | "probably_switched_off"
  | "memory_high";

export interface SessionRecord {
  id: string;
  startedAt: number;
  lastBeatAt: number;
  heapStartMB: number | null;
  heapLastMB: number | null;
  heapPeakMB: number | null;
  heapLimitMB: number | null;
  cleanExit: boolean;
}

export interface TvHealthReport {
  event: TvHealthEvent;
  /** When the dead session was last known alive (epoch ms). */
  lastBeatAt: number;
  uptimeMin: number;
  /** Minutes between the last heartbeat and this report. */
  downMin: number;
  heapStartMB: number | null;
  heapLastMB: number | null;
  heapPeakMB: number | null;
  heapLimitMB: number | null;
}

const toMB = (bytes: number) => Math.round(bytes / (1024 * 1024));

/** Chromium-only (`performance.memory`); null where the browser does not expose it. */
export function readHeap(): { usedMB: number; limitMB: number } | null {
  try {
    const mem = (
      performance as unknown as {
        memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number };
      }
    ).memory;
    if (
      !mem ||
      typeof mem.usedJSHeapSize !== "number" ||
      typeof mem.jsHeapSizeLimit !== "number" ||
      mem.jsHeapSizeLimit <= 0
    ) {
      return null;
    }
    return {
      usedMB: toMB(mem.usedJSHeapSize),
      limitMB: toMB(mem.jsHeapSizeLimit),
    };
  } catch {
    return null;
  }
}

export function heapRatio(
  usedMB: number | null,
  limitMB: number | null,
): number | null {
  if (usedMB == null || limitMB == null || limitMB <= 0) return null;
  return usedMB / limitMB;
}

function isRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.startedAt === "number" &&
    typeof r.lastBeatAt === "number" &&
    Number.isFinite(r.startedAt) &&
    Number.isFinite(r.lastBeatAt)
  );
}

export function readRecord(): SessionRecord | null {
  try {
    const raw = localStorage.getItem(HEALTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeRecord(record: SessionRecord) {
  try {
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // storage full/unavailable — monitoring is best-effort
  }
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Decides what happened to the previous session.
 * Returns null when it ended normally (or there was none).
 */
export function classifyPreviousSession(
  record: SessionRecord | null,
  now: number,
): TvHealthReport | null {
  if (!record || record.cleanExit === true) return null;

  const heapLastMB = num(record.heapLastMB);
  const heapPeakMB = num(record.heapPeakMB);
  const heapLimitMB = num(record.heapLimitMB);
  const downMs = Math.max(0, now - record.lastBeatAt);
  const ratio = heapRatio(heapPeakMB ?? heapLastMB, heapLimitMB);

  let event: TvHealthEvent;
  if (ratio !== null && ratio >= HIGH_HEAP_RATIO) event = "likely_oom";
  else if (downMs < QUICK_RESTART_MS) event = "unexpected_restart";
  else event = "probably_switched_off";

  return {
    event,
    lastBeatAt: record.lastBeatAt,
    uptimeMin: Math.max(
      0,
      Math.round((record.lastBeatAt - record.startedAt) / 60_000),
    ),
    downMin: Math.round(downMs / 60_000),
    heapStartMB: num(record.heapStartMB),
    heapLastMB,
    heapPeakMB,
    heapLimitMB,
  };
}

function sendReport(report: TvHealthReport) {
  try {
    void fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {
      // reporting must never affect the display
    });
  } catch {
    // ignore
  }
}

/**
 * Starts monitoring. Returns a function that stops it.
 * Safe to call when storage, fetch or performance.memory are unavailable.
 */
export function startTvHealthMonitor(): () => void {
  if (typeof window === "undefined") return () => {};

  const now = Date.now();
  const previous = classifyPreviousSession(readRecord(), now);
  if (previous) sendReport(previous);

  const heap = readHeap();
  const record: SessionRecord = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: now,
    lastBeatAt: now,
    heapStartMB: heap?.usedMB ?? null,
    heapLastMB: heap?.usedMB ?? null,
    heapPeakMB: heap?.usedMB ?? null,
    heapLimitMB: heap?.limitMB ?? null,
    cleanExit: false,
  };
  writeRecord(record);

  let memoryHighReported = false;

  const beat = () => {
    const current = readHeap();
    record.lastBeatAt = Date.now();
    record.cleanExit = false;
    if (current) {
      record.heapLastMB = current.usedMB;
      record.heapLimitMB = current.limitMB;
      record.heapPeakMB = Math.max(record.heapPeakMB ?? 0, current.usedMB);
    }
    writeRecord(record);

    // Memory nearly exhausted: warn once and refresh before the browser kills the tab.
    const ratio = heapRatio(record.heapLastMB, record.heapLimitMB);
    if (!memoryHighReported && ratio !== null && ratio >= HIGH_HEAP_RATIO) {
      memoryHighReported = true;
      sendReport({
        event: "memory_high",
        lastBeatAt: record.lastBeatAt,
        uptimeMin: Math.round((record.lastBeatAt - record.startedAt) / 60_000),
        downMin: 0,
        heapStartMB: record.heapStartMB,
        heapLastMB: record.heapLastMB,
        heapPeakMB: record.heapPeakMB,
        heapLimitMB: record.heapLimitMB,
      });
      safeReload("memory nearly exhausted");
    }
  };

  const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);

  // Normal page exit (reload, navigation, tab closed): not a crash.
  const onPageHide = () => {
    record.lastBeatAt = Date.now();
    record.cleanExit = true;
    writeRecord(record);
  };
  // Page restored from the back/forward cache: it is running again.
  const onPageShow = (e: Event) => {
    if ((e as PageTransitionEvent).persisted) beat();
  };

  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    clearInterval(interval);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    // Monitor stopped on purpose (component unmounted) — not a crash either.
    onPageHide();
  };
}
