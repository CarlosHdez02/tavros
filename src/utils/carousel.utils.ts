import type { RowType } from "@/types/components.type";

const ALLOWED_TYPES: readonly RowType[] = ["table", "video", "gallery"];

/**
 * Normalizes API/CSV `id` to a finite non-negative integer for keys and analytics.
 * Prevents string IDs or invalid values from breaking modulo / React keys.
 */
export function normalizeSlideId(id: unknown, fallbackIndex: number): number {
  const n = Number(id);
  if (Number.isFinite(n) && n >= 0) {
    return Math.floor(n);
  }
  return fallbackIndex + 1;
}

/**
 * Parses and validates row type from sheet data (handles stray whitespace / casing).
 * Returns null when the row cannot be mapped to a carousel slide.
 */
export function parseRowType(raw: unknown): RowType | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  return (ALLOWED_TYPES as readonly string[]).includes(t)
    ? (t as RowType)
    : null;
}

/** Video rows without a URL would only show a dead slide in production — skip them. */
export function hasUsableVideoLink(link: unknown): boolean {
  if (link == null) return false;
  if (typeof link !== "string") return false;
  return link.trim().length > 0;
}
