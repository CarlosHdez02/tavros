/**
 * Posts one line to Slack #notifications as Pip — same webhook and format as
 * platforms-scraper's `post_alert` (src/utils.py). Server-side only: the
 * webhook URL must never reach the browser.
 * Never throws. Resolves true only when Slack accepted the message.
 */
const ALERT_MAX_CHARS = 1000;
const ALERT_TIMEOUT_MS = 10_000;

export async function postAlert(text: string): Promise<boolean> {
  const url = process.env.SLACK_ALERT_WEBHOOK;
  if (!url) {
    console.warn("slack_alert_skipped_no_webhook");
    return false;
  }
  let line = `[tavros-tv] ${text}`;
  if (line.length > ALERT_MAX_CHARS) {
    line = `${line.slice(0, ALERT_MAX_CHARS - 1)}…`;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: line }),
      signal: AbortSignal.timeout(ALERT_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`slack_alert_failed: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    // an alert must never break the app
    console.warn(
      "slack_alert_failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}
