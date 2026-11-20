import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const safeReload = vi.fn();
vi.mock("@/utils/recovery", () => ({
  safeReload: (reason: string) => safeReload(reason),
}));

import {
  classifyPreviousSession,
  HEALTH_STORAGE_KEY,
  readHeap,
  readRecord,
  type SessionRecord,
  startTvHealthMonitor,
} from "./tvHealth";

const MB = 1024 * 1024;
const MIN = 60_000;
const HOUR = 60 * MIN;

const setHeap = (usedMB: number | null, limitMB = 2048) => {
  Object.defineProperty(performance, "memory", {
    configurable: true,
    value:
      usedMB === null
        ? undefined
        : { usedJSHeapSize: usedMB * MB, jsHeapSizeLimit: limitMB * MB },
  });
};

const baseRecord = (over: Partial<SessionRecord> = {}): SessionRecord => ({
  id: "s1",
  startedAt: 1_000_000,
  lastBeatAt: 1_000_000 + 5 * HOUR,
  heapStartMB: 100,
  heapLastMB: 300,
  heapPeakMB: 320,
  heapLimitMB: 2048,
  cleanExit: false,
  ...over,
});

describe("classifyPreviousSession", () => {
  const died = 1_000_000 + 5 * HOUR;

  it("no previous session → nothing to report", () => {
    expect(classifyPreviousSession(null, Date.now())).toBeNull();
  });

  it("clean exit (reload / navigation) → nothing to report", () => {
    expect(
      classifyPreviousSession(baseRecord({ cleanExit: true }), died + MIN),
    ).toBeNull();
  });

  it("died with memory near the limit → likely out of memory", () => {
    const report = classifyPreviousSession(
      baseRecord({ heapLastMB: 1800, heapPeakMB: 1900 }),
      died + 4 * MIN,
    );
    expect(report).toMatchObject({
      event: "likely_oom",
      uptimeMin: 300,
      downMin: 4,
      heapStartMB: 100,
      heapPeakMB: 1900,
      heapLimitMB: 2048,
      lastBeatAt: died,
    });
  });

  it("high memory wins even after a long gap (crashed, nobody reloaded for hours)", () => {
    const report = classifyPreviousSession(
      baseRecord({ heapLastMB: 1700, heapPeakMB: 1700 }),
      died + 10 * HOUR,
    );
    expect(report?.event).toBe("likely_oom");
  });

  it("uses the peak reading, not only the last one", () => {
    const report = classifyPreviousSession(
      baseRecord({ heapLastMB: 200, heapPeakMB: 1900 }),
      died + MIN,
    );
    expect(report?.event).toBe("likely_oom");
  });

  it("died with normal memory and reloaded soon → unexpected restart", () => {
    const report = classifyPreviousSession(baseRecord(), died + 10 * MIN);
    expect(report?.event).toBe("unexpected_restart");
  });

  it("died with normal memory and came back much later → TV was switched off", () => {
    const report = classifyPreviousSession(baseRecord(), died + 9 * HOUR);
    expect(report?.event).toBe("probably_switched_off");
  });

  it("no memory readings (non-Chromium browser): decided by the gap alone", () => {
    const noHeap = baseRecord({
      heapStartMB: null,
      heapLastMB: null,
      heapPeakMB: null,
      heapLimitMB: null,
    });
    expect(classifyPreviousSession(noHeap, died + 5 * MIN)?.event).toBe(
      "unexpected_restart",
    );
    expect(classifyPreviousSession(noHeap, died + 5 * HOUR)?.event).toBe(
      "probably_switched_off",
    );
  });

  it("clock going backwards never produces negative numbers", () => {
    const report = classifyPreviousSession(baseRecord(), died - HOUR);
    expect(report?.downMin).toBe(0);
    expect(report?.uptimeMin).toBeGreaterThanOrEqual(0);
  });

  it("tolerates junk values inside a stored record", () => {
    const report = classifyPreviousSession(
      baseRecord({
        heapLastMB: "x" as unknown as number,
        heapPeakMB: Number.NaN,
        heapLimitMB: 0,
      }),
      died + MIN,
    );
    expect(report?.event).toBe("unexpected_restart");
    expect(report?.heapLastMB).toBeNull();
    expect(report?.heapPeakMB).toBeNull();
  });
});

describe("readHeap", () => {
  afterEach(() => setHeap(null));

  it("returns MB when the browser exposes performance.memory", () => {
    setHeap(512, 2048);
    expect(readHeap()).toEqual({ usedMB: 512, limitMB: 2048 });
  });

  it("returns null when it does not", () => {
    setHeap(null);
    expect(readHeap()).toBeNull();
  });
});

describe("startTvHealthMonitor", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let stop: (() => void) | undefined;

  const reports = () =>
    fetchMock.mock.calls.map(([url, init]) => ({
      url: String(url),
      body: JSON.parse((init as RequestInit).body as string),
    }));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T08:00:00"));
    localStorage.clear();
    safeReload.mockClear();
    setHeap(100);
    fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    setHeap(null);
  });

  /** Simulates the browser killing the tab: timers stop, no pagehide fires. */
  const killTab = () => {
    const diedAt = Date.now();
    vi.clearAllTimers();
    vi.setSystemTime(diedAt); // clearing timers must not move the clock
    stop = undefined;
  };

  it("first ever load: reports nothing and starts a heartbeat record", () => {
    stop = startTvHealthMonitor();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readRecord()).toMatchObject({
      cleanExit: false,
      heapStartMB: 100,
      heapLimitMB: 2048,
    });
  });

  it("updates the heartbeat every 30s with the latest and peak memory", () => {
    stop = startTvHealthMonitor();
    const started = Date.now();
    setHeap(400);
    vi.advanceTimersByTime(30_000);
    setHeap(250);
    vi.advanceTimersByTime(30_000);
    expect(readRecord()).toMatchObject({
      startedAt: started,
      lastBeatAt: started + 60_000,
      heapStartMB: 100,
      heapLastMB: 250,
      heapPeakMB: 400,
    });
  });

  it("normal reload (pagehide) is NOT reported on the next load", () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(2 * HOUR);
    window.dispatchEvent(new Event("pagehide"));
    killTab();

    vi.setSystemTime(Date.now() + 5_000);
    stop = startTvHealthMonitor();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("OUT OF MEMORY: tab killed with memory near the limit → reported as likely_oom on next load", () => {
    stop = startTvHealthMonitor();
    setHeap(900);
    vi.advanceTimersByTime(3 * HOUR);
    // climbs past the threshold between two heartbeats and the tab dies
    setHeap(1500);
    vi.advanceTimersByTime(30_000);
    fetchMock.mockClear();
    safeReload.mockClear();
    setHeap(1900);
    vi.advanceTimersByTime(30_000);
    fetchMock.mockClear();
    killTab();

    vi.setSystemTime(Date.now() + 6 * MIN);
    setHeap(90);
    stop = startTvHealthMonitor();
    const sent = reports();
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe("/api/telemetry");
    expect(sent[0].body).toMatchObject({
      event: "likely_oom",
      downMin: 6,
      heapStartMB: 100,
      heapPeakMB: 1900,
      heapLimitMB: 2048,
    });
    expect(sent[0].body.uptimeMin).toBeGreaterThanOrEqual(180);
  });

  it("tab killed with normal memory and reloaded minutes later → unexpected_restart", () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(HOUR);
    killTab();
    vi.setSystemTime(Date.now() + 3 * MIN);
    stop = startTvHealthMonitor();
    expect(reports()[0].body).toMatchObject({
      event: "unexpected_restart",
      uptimeMin: 60,
      downMin: 3,
    });
  });

  it("TV switched off overnight → reported as probably_switched_off (log only)", () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(4 * HOUR);
    killTab();
    vi.setSystemTime(Date.now() + 10 * HOUR);
    stop = startTvHealthMonitor();
    expect(reports()[0].body.event).toBe("probably_switched_off");
  });

  it("a crash is reported only once", () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(HOUR);
    killTab();
    vi.setSystemTime(Date.now() + MIN);
    stop = startTvHealthMonitor();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("pagehide"));
    killTab();
    vi.setSystemTime(Date.now() + MIN);
    stop = startTvHealthMonitor();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("memory crossing 80% while alive: warns once and asks for a safe reload before the crash", () => {
    stop = startTvHealthMonitor();
    setHeap(1000);
    vi.advanceTimersByTime(30_000);
    expect(safeReload).not.toHaveBeenCalled();

    setHeap(1700); // 83%
    vi.advanceTimersByTime(30_000);
    expect(safeReload).toHaveBeenCalledWith("memory nearly exhausted");
    expect(reports()).toHaveLength(1);
    expect(reports()[0].body).toMatchObject({
      event: "memory_high",
      heapLastMB: 1700,
      heapLimitMB: 2048,
    });

    vi.advanceTimersByTime(10 * MIN);
    expect(reports()).toHaveLength(1); // not repeated every heartbeat
    expect(safeReload).toHaveBeenCalledTimes(1);
  });

  it("works without performance.memory (no memory fields, still detects the crash)", () => {
    setHeap(null);
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(HOUR);
    expect(safeReload).not.toHaveBeenCalled();
    killTab();
    vi.setSystemTime(Date.now() + 2 * MIN);
    stop = startTvHealthMonitor();
    expect(reports()[0].body).toMatchObject({
      event: "unexpected_restart",
      heapLastMB: null,
      heapLimitMB: null,
    });
  });

  it("stopping the monitor (component unmount) counts as a clean exit", () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(HOUR);
    stop();
    stop = undefined;
    expect(readRecord()?.cleanExit).toBe(true);
    stop = startTvHealthMonitor();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("page restored from the back/forward cache is marked as running again", () => {
    stop = startTvHealthMonitor();
    window.dispatchEvent(new Event("pagehide"));
    expect(readRecord()?.cleanExit).toBe(true);
    const show = new Event("pageshow");
    Object.defineProperty(show, "persisted", { value: true });
    window.dispatchEvent(show);
    expect(readRecord()?.cleanExit).toBe(false);
  });

  it("corrupted stored record is ignored", () => {
    localStorage.setItem(HEALTH_STORAGE_KEY, "{not json");
    expect(() => {
      stop = startTvHealthMonitor();
    }).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify({ foo: 1 }));
    stop?.();
    stop = startTvHealthMonitor();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when storage is unavailable or reporting fails", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fetchMock.mockImplementation(() => Promise.reject(new Error("offline")));
    expect(() => {
      stop = startTvHealthMonitor();
      vi.advanceTimersByTime(5 * MIN);
    }).not.toThrow();
  });

  it("a failing report request does not break the display", async () => {
    stop = startTvHealthMonitor();
    vi.advanceTimersByTime(HOUR);
    killTab();
    fetchMock.mockImplementation(() => {
      throw new Error("fetch exploded");
    });
    vi.setSystemTime(Date.now() + MIN);
    expect(() => {
      stop = startTvHealthMonitor();
    }).not.toThrow();
  });
});
