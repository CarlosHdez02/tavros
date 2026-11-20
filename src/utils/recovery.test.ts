import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Recovery = typeof import("./recovery");

/** recovery.ts keeps a module-level "reload pending" flag, so load a fresh copy per test. */
async function loadRecovery(): Promise<Recovery> {
  vi.resetModules();
  return import("./recovery");
}

const okResponse = { ok: true } as Response;
const badResponse = { ok: false, status: 503 } as Response;

describe("recovery utils", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let onLine = true;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T10:00:00"));
    sessionStorage.clear();
    onLine = true;
    vi.spyOn(navigator, "onLine", "get").mockImplementation(() => onLine);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock = vi.fn(() => Promise.resolve(okResponse));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe("isChunkLoadError", () => {
    it.each([
      [Object.assign(new Error("boom"), { name: "ChunkLoadError" })],
      [new Error("Loading chunk 123 failed.")],
      [new Error("Loading CSS chunk 5 failed")],
      [new TypeError("Failed to fetch dynamically imported module: /x.js")],
      [new TypeError("Importing a module script failed.")],
    ])("detects chunk failures: %s", async (err) => {
      const { isChunkLoadError } = await loadRecovery();
      expect(isChunkLoadError(err)).toBe(true);
    });

    it.each([
      [new Error("Cannot read properties of undefined")],
      [null],
      [undefined],
      ["string error"],
      [{}],
    ])("ignores everything else: %s", async (err) => {
      const { isChunkLoadError } = await loadRecovery();
      expect(isChunkLoadError(err)).toBe(false);
    });
  });

  describe("isServerReachable", () => {
    it("is true when the server answers OK, probing with an uncached HEAD", async () => {
      const { isServerReachable } = await loadRecovery();
      await expect(isServerReachable()).resolves.toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("probe=");
      expect(init).toMatchObject({ method: "HEAD", cache: "no-store" });
    });

    it("is false when the server answers with an error status", async () => {
      fetchMock.mockResolvedValue(badResponse);
      const { isServerReachable } = await loadRecovery();
      await expect(isServerReachable()).resolves.toBe(false);
    });

    it("is false when the request fails (no network)", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      const { isServerReachable } = await loadRecovery();
      await expect(isServerReachable()).resolves.toBe(false);
    });

    it("is false without even probing when the browser reports offline", async () => {
      onLine = false;
      const { isServerReachable } = await loadRecovery();
      await expect(isServerReachable()).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("gives up (false) when the server hangs past the probe timeout", async () => {
      fetchMock.mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      );
      const { isServerReachable } = await loadRecovery();
      const result = isServerReachable();
      await vi.advanceTimersByTimeAsync(8_000);
      await expect(result).resolves.toBe(false);
    });
  });

  describe("safeReload", () => {
    it("reloads when the server is reachable", async () => {
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(0);
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("does NOT reload while the server is unreachable (would land on a white browser error page)", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      expect(reload).not.toHaveBeenCalled();
      // kept probing every 30s the whole time
      expect(fetchMock.mock.calls.length).toBeGreaterThan(10);
    });

    it("keeps retrying and reloads once the server comes back", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(65_000);
      expect(reload).not.toHaveBeenCalled();

      fetchMock.mockResolvedValue(okResponse);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("does not reload while offline, then reloads when back online", async () => {
      onLine = false;
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(120_000);
      expect(reload).not.toHaveBeenCalled();

      onLine = true;
      await vi.advanceTimersByTimeAsync(30_000);
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("is idempotent: many callers produce a single reload", async () => {
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("a");
      recovery.safeReload("b");
      recovery.safeReload("c");
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(reload).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("never reloads twice within a minute (no reload loops on a persistent bug)", async () => {
      // Simulates a page that just reloaded 10s ago and immediately hits the same error
      sessionStorage.setItem("tavros:lastReloadAt", String(Date.now() - 10_000));
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(45_000);
      expect(reload).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("records the reload time so the next page load can rate-limit", async () => {
      const recovery = await loadRecovery();
      vi.spyOn(recovery.pageReloader, "reload").mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(0);
      expect(Number(sessionStorage.getItem("tavros:lastReloadAt"))).toBe(
        Date.now(),
      );
    });

    it("still works when sessionStorage is unavailable", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("denied");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("denied");
      });
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      recovery.safeReload("test");
      await vi.advanceTimersByTimeAsync(0);
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });

  describe("retryImport", () => {
    it("returns the module when the first attempt works (no reload)", async () => {
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      const importer = vi.fn(() => Promise.resolve({ default: "mod" }));
      await expect(recovery.retryImport(importer)).resolves.toEqual({
        default: "mod",
      });
      expect(importer).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(reload).not.toHaveBeenCalled();
    });

    it("retries a flaky import and succeeds without reloading", async () => {
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      const importer = vi
        .fn<() => Promise<{ default: string }>>()
        .mockRejectedValueOnce(new Error("Loading chunk 1 failed"))
        .mockRejectedValueOnce(new Error("Loading chunk 1 failed"))
        .mockResolvedValue({ default: "mod" });
      const result = recovery.retryImport(importer);
      await vi.advanceTimersByTimeAsync(10_000);
      await expect(result).resolves.toEqual({ default: "mod" });
      expect(importer).toHaveBeenCalledTimes(3);
      expect(reload).not.toHaveBeenCalled();
    });

    it("after all retries fail (new deployment), rejects and schedules a safe reload", async () => {
      const recovery = await loadRecovery();
      const reload = vi
        .spyOn(recovery.pageReloader, "reload")
        .mockImplementation(() => {});
      const error = new Error("Loading chunk 1 failed");
      const importer = vi.fn(() => Promise.reject(error));
      const result = recovery.retryImport(importer);
      const assertion = expect(result).rejects.toBe(error);
      await vi.advanceTimersByTimeAsync(30_000);
      await assertion;
      expect(importer).toHaveBeenCalledTimes(4); // 1 try + 3 retries
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
