import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCarouselData } from "./useCarouselData";

const mockApiResponse = {
  success: true,
  data: {
    all: [
      { id: 1, type: "table", title: "Horario del dia", durationSeconds: 300 },
      {
        id: 2,
        type: "video",
        title: "MARKETING_Arte Griego_P1",
        youtubeLink: "https://www.youtube.com/watch?v=nkaKgsuzMak",
        durationSeconds: 601,
      },
    ],
  },
};

describe("useCarouselData", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("parses successful API response and sets data from data.all", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockApiResponse.data.all);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith("/api/videos");
  });

  it("does not throw when API returns non-ok (500) - sets error state after retries", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Failed to fetch carousel data");
        expect(result.current.data).toEqual([]);
      },
      { timeout: 8000 },
    );
  });

  it("does not throw on network error - sets error state after retries", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useCarouselData());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Failed to fetch carousel data");
        expect(result.current.data).toEqual([]);
      },
      { timeout: 8000 },
    );
  });

  it("handles invalid response format (success false) and sets error after retries", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: false, data: {} }),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Invalid response format");
      },
      { timeout: 10000 },
    );
  });

  it("handles missing data.all and sets error after retries", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Invalid response format");
      },
      { timeout: 10000 },
    );
  });
});
