import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
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
    table: [],
    videos: [],
    gallery: [],
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useCarouselData", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("parses successful API response and returns CarouselData", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockApiResponse.data);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/videos",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("does not throw when API returns non-ok (500) - sets error after retries", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error?.message).toBe("Failed to fetch carousel data");
      },
      { timeout: 3000 },
    );
  });

  it("does not throw on network error - sets error after retries", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useCarouselData(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error?.message).toBe("Failed to fetch carousel data");
      },
      { timeout: 3000 },
    );
  });

  it("handles invalid response format (success false) and sets error", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: false, data: {} }),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error?.message).toBe("Invalid response format");
      },
      { timeout: 3000 },
    );
  });

  it("handles missing data.all and sets error", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response),
    );

    const { result } = renderHook(() => useCarouselData(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error?.message).toBe("Invalid response format");
      },
      { timeout: 3000 },
    );
  });
});
