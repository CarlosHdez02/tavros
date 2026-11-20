/**
 * Recovery helpers for the always-on TV display.
 *
 * The page must never end up on a white screen. A plain `location.reload()` is
 * dangerous on a kiosk: if the server is cold/unreachable the browser shows its own
 * blank/white error page and nobody is there to press reload again. So we only
 * reload after confirming the server answers; otherwise we keep the current
 * (dark) screen and try again later.
 */

const PROBE_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 30_000;
/** Never reload more often than this, to avoid reload loops on a persistent bug. */
const MIN_RELOAD_INTERVAL_MS = 60_000;
const LAST_RELOAD_KEY = "tavros:lastReloadAt";

let reloadPending = false;

/** Indirection so tests can observe reloads (jsdom's location.reload cannot be mocked). */
export const pageReloader = {
  reload: () => window.location.reload(),
};

function readLastReload(): number {
  try {
    return Number(sessionStorage.getItem(LAST_RELOAD_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastReload(ts: number) {
  try {
    sessionStorage.setItem(LAST_RELOAD_KEY, String(ts));
  } catch {
    // storage unavailable — ignore
  }
}

export async function isServerReachable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${window.location.pathname}?probe=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Reloads the page only once the server is confirmed reachable.
 * Retries every 30s until it is; safe to call repeatedly.
 */
export function safeReload(reason: string): void {
  if (typeof window === "undefined" || reloadPending) return;
  reloadPending = true;

  const attempt = async () => {
    const sinceLast = Date.now() - readLastReload();
    if (sinceLast < MIN_RELOAD_INTERVAL_MS) {
      setTimeout(attempt, MIN_RELOAD_INTERVAL_MS - sinceLast);
      return;
    }
    if (await isServerReachable()) {
      console.warn(`[recovery] reloading page: ${reason}`);
      writeLastReload(Date.now());
      pageReloader.reload();
    } else {
      setTimeout(attempt, RETRY_DELAY_MS);
    }
  };
  void attempt();
}

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { name?: string; message?: string };
  const text = `${e.name ?? ""} ${e.message ?? ""}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    text,
  );
}

/**
 * Wraps a dynamic import with retries. After a new deployment the old chunk URLs
 * 404 and React caches the failed lazy import forever, so if retries fail we
 * schedule a safe reload to pick up the new build.
 */
export async function retryImport<T>(
  importer: () => Promise<T>,
  retries = 3,
  delayMs = 1_500,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await importer();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  safeReload("dynamic import failed (likely new deployment)");
  throw lastError;
}
