import { describe, expect, it } from "vitest";
import { hasUsableVideoLink, normalizeSlideId, parseRowType } from "./carousel.utils";

describe("normalizeSlideId", () => {
  it("returns finite integers for numeric ids", () => {
    expect(normalizeSlideId(42, 0)).toBe(42);
    expect(normalizeSlideId("7", 0)).toBe(7);
    expect(normalizeSlideId(3.9, 0)).toBe(3);
  });

  it("uses fallback index when id is invalid", () => {
    expect(normalizeSlideId(undefined, 0)).toBe(1);
    expect(normalizeSlideId("x", 2)).toBe(3);
    expect(normalizeSlideId(Number.NaN, 4)).toBe(5);
    expect(normalizeSlideId(Number.POSITIVE_INFINITY, 0)).toBe(1);
  });
});

describe("hasUsableVideoLink", () => {
  it("rejects null, empty, whitespace-only", () => {
    expect(hasUsableVideoLink(null)).toBe(false);
    expect(hasUsableVideoLink(undefined)).toBe(false);
    expect(hasUsableVideoLink("")).toBe(false);
    expect(hasUsableVideoLink("   ")).toBe(false);
  });

  it("accepts non-empty strings", () => {
    expect(hasUsableVideoLink("https://youtu.be/x")).toBe(true);
  });
});

describe("parseRowType", () => {
  it("accepts allowed types with trimming and case", () => {
    expect(parseRowType("video")).toBe("video");
    expect(parseRowType(" TABLE ")).toBe("table");
    expect(parseRowType("Gallery")).toBe("gallery");
  });

  it("rejects unknown or non-string values", () => {
    expect(parseRowType("video_extra")).toBeNull();
    expect(parseRowType("")).toBeNull();
    expect(parseRowType(null)).toBeNull();
    expect(parseRowType(123)).toBeNull();
  });
});
