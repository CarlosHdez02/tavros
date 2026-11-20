import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postAlert } from "./slackAlert";
import {
  __resetTelemetryRateLimitForTests,
  buildAlertText,
  handleTelemetry,
  type TelemetryReport,
} from "./tvTelemetry";

const WEBHOOK = "https://hooks.slack.test/services/T000/B000/XXXX";

const report = (over: Partial<TelemetryReport> = {}): TelemetryReport => ({
  event: "likely_oom",
  lastBeatAt: new Date("2026-01-15T20:32:00Z").getTime(), // 14:32 in Mexico City
  uptimeMin: 310,
  downMin: 4,
  heapStartMB: 120,
  heapLastMB: 1800,
  heapPeakMB: 1850,
  heapLimitMB: 2048,
  ...over,
});

describe("TV telemetry → Slack (Pip)", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  const slackTexts = () =>
    fetchMock.mock.calls.map(
      ([, init]) => JSON.parse((init as RequestInit).body as string).text,
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T21:00:00Z"));
    __resetTelemetryRateLimitForTests();
    vi.stubEnv("SLACK_ALERT_WEBHOOK", WEBHOOK);
    fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response));
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe("postAlert", () => {
    it("posts one line to the webhook, tagged like the scraper's alerts", async () => {
      await expect(postAlert("hello")).resolves.toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(WEBHOOK);
      expect((init as RequestInit).method).toBe("POST");
      expect(slackTexts()[0]).toBe("[tavros-tv] hello");
    });

    it("skips quietly when the webhook is not configured", async () => {
      vi.stubEnv("SLACK_ALERT_WEBHOOK", "");
      await expect(postAlert("hello")).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns false (never throws) when Slack rejects or the network fails", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
      await expect(postAlert("a")).resolves.toBe(false);
      fetchMock.mockRejectedValueOnce(new Error("network down"));
      await expect(postAlert("b")).resolves.toBe(false);
    });

    it("truncates very long messages to 1000 characters", async () => {
      await postAlert("x".repeat(5000));
      expect(slackTexts()[0]).toHaveLength(1000);
      expect(slackTexts()[0].endsWith("…")).toBe(true);
    });
  });

  describe("buildAlertText", () => {
    it("out of memory: says so, with when, how long it ran, downtime and memory", () => {
      const text = buildAlertText(report());
      expect(text).toContain("probably ran out of memory");
      expect(text).toContain("14:32");
      expect(text).toContain("5h 10m");
      expect(text).toContain("4 min later");
      expect(text).toContain("1850 of 2048 MB (90%)");
      expect(text).toContain("up from 120 MB at start");
    });

    it("unexpected restart: described as a crash/blank screen", () => {
      const text = buildAlertText(
        report({ event: "unexpected_restart", heapPeakMB: 300, heapLastMB: 280 }),
      );
      expect(text).toContain("stopped unexpectedly");
      expect(text).toContain("300 of 2048 MB (15%)");
    });

    it("memory high: says the display is refreshing itself", () => {
      const text = buildAlertText(report({ event: "memory_high", downMin: 0 }));
      expect(text).toContain("close to running out of memory");
      expect(text).toContain("refreshing itself");
    });

    it("TV switched off: no Slack message", () => {
      expect(
        buildAlertText(report({ event: "probably_switched_off" })),
      ).toBeNull();
    });

    it("no memory readings: says they are not available instead of printing null/NaN", () => {
      const text = buildAlertText(
        report({
          event: "unexpected_restart",
          heapStartMB: null,
          heapLastMB: null,
          heapPeakMB: null,
          heapLimitMB: null,
        }),
      );
      expect(text).toContain("not available");
      expect(text).not.toMatch(/null|NaN|undefined/);
    });
  });

  describe("handleTelemetry", () => {
    it("out-of-memory report → one Slack alert", async () => {
      const res = await handleTelemetry(report());
      expect(res).toEqual({ status: 200, body: { ok: true, alerted: true } });
      expect(slackTexts()).toHaveLength(1);
      expect(slackTexts()[0]).toMatch(/^\[tavros-tv\] The TV display probably ran out of memory/);
    });

    it("TV switched off → logged, not alerted", async () => {
      const res = await handleTelemetry(
        report({ event: "probably_switched_off" }),
      );
      expect(res.body).toEqual({ ok: true, alerted: false });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "tv_health_report",
        expect.stringContaining("probably_switched_off"),
      );
    });

    it("every valid report is written to the server logs", async () => {
      await handleTelemetry(report());
      expect(console.log).toHaveBeenCalledWith(
        "tv_health_report",
        expect.stringContaining("likely_oom"),
      );
    });

    it.each([
      ["null", null],
      ["a string", "boom"],
      ["empty object", {}],
      ["unknown event", { ...report(), event: "hacked" }],
      ["negative uptime", { ...report(), uptimeMin: -1 }],
      ["text where a number goes", { ...report(), heapLastMB: "<!channel> spam" }],
      ["missing fields", { event: "likely_oom" }],
    ])("rejects invalid input (%s) without posting to Slack", async (_label, body) => {
      const res = await handleTelemetry(body);
      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("extra free-text fields from the client never reach Slack", async () => {
      await handleTelemetry({ ...report(), note: "<!channel> click http://evil" });
      expect(slackTexts()[0]).not.toContain("evil");
      expect(slackTexts()[0]).not.toContain("<!channel>");
    });

    it("rate limit: repeated reports of the same kind within 5 minutes alert once", async () => {
      await handleTelemetry(report());
      await handleTelemetry(report());
      vi.advanceTimersByTime(4 * 60_000);
      await handleTelemetry(report());
      expect(slackTexts()).toHaveLength(1);

      vi.advanceTimersByTime(61_000);
      const res = await handleTelemetry(report());
      expect(res.body.alerted).toBe(true);
      expect(slackTexts()).toHaveLength(2);
    });

    it("different kinds of event are rate-limited separately", async () => {
      await handleTelemetry(report());
      await handleTelemetry(report({ event: "memory_high", downMin: 0 }));
      expect(slackTexts()).toHaveLength(2);
    });

    it("a failed Slack post does not use up the rate limit", async () => {
      fetchMock.mockRejectedValueOnce(new Error("slack down"));
      const first = await handleTelemetry(report());
      expect(first.body).toEqual({ ok: true, alerted: false });
      const second = await handleTelemetry(report());
      expect(second.body.alerted).toBe(true);
    });

    it("no webhook configured: still 200 and logged", async () => {
      vi.stubEnv("SLACK_ALERT_WEBHOOK", "");
      const res = await handleTelemetry(report());
      expect(res).toEqual({ status: 200, body: { ok: true, alerted: false } });
    });
  });
});
