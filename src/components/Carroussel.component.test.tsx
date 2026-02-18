import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { CarouselRow } from "@/hooks/useCarouselData";

// Mutable state for useCarouselData mock - tests set this before rendering
const mockCarouselState = {
  data: [] as CarouselRow[],
  loading: false,
  /** Set true to simulate 60s refetch: return new array reference (same content) */
  simulateRefetch: false,
};

vi.mock("@/hooks/useCarouselData", () => ({
  useCarouselData: () => {
    const all = mockCarouselState.simulateRefetch
      ? [...mockCarouselState.data]
      : mockCarouselState.data;
    const data = { all, table: [], videos: [], gallery: [] };
    return { data, isLoading: mockCarouselState.loading };
  },
}));

// Mock next/dynamic to return components synchronously (no loading state in tests)
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<{ default: React.ComponentType }>) => {
    const mod = importFn.toString();
    if (mod.includes("Table")) return () => <div data-testid="table-slide">Table</div>;
    if (mod.includes("Gallery")) return () => <div data-testid="gallery-slide">Gallery</div>;
    return () => null;
  },
}));
vi.mock("./Video-cards.component", () => ({
  default: () => <div data-testid="video-slide">Video</div>,
}));

// Import after mocks
import CarrouselWrapper from "./Carroussel.component";

const createMockData = (overrides: CarouselRow[] = []): CarouselRow[] => [
  { id: 1, type: "table", title: "Table", description: "", durationSeconds: 5 },
  { id: 2, type: "video", title: "Video", description: "", youtubeLink: "https://youtube.com/watch?v=x", durationSeconds: 8 },
  { id: 3, type: "gallery", title: "Gallery", description: "", durationSeconds: 12 },
  ...overrides,
];

describe("CarrouselWrapper", () => {
  beforeEach(() => {
    mockCarouselState.data = createMockData();
    mockCarouselState.loading = false;
    mockCarouselState.simulateRefetch = false;
  });

  it("does not show white screen - loading state has dark background", () => {
    mockCarouselState.data = [];
    mockCarouselState.loading = true;

    const { container } = render(<CarrouselWrapper />);
    const loadingEl = container.querySelector(".bg-\\[\\#0f1419\\]");
    expect(loadingEl).toBeTruthy();
    expect(screen.getByText("Loading carousel...")).toBeInTheDocument();
  });

  it("renders the first element from Excel data on mount", () => {
    render(<CarrouselWrapper />);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
  });

  it("renders all element types from Excel - table, video, gallery", () => {
    mockCarouselState.data = createMockData();

    render(<CarrouselWrapper />);
    // First slide is table
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
  });

  it("advances to next slide after duration and loops back to start", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = createMockData();
    render(<CarrouselWrapper />);

    // Initially table (index 0)
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // Advance 5 seconds (table duration) -> should go to video
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    // Advance 8 seconds (video duration) -> should go to gallery
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();

    // Advance 12 seconds (gallery duration) -> should loop to table
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("uses durationSeconds from Excel for each slide", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 3 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 7 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // 2 seconds - still on table (duration is 3s)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // +1 more second (total 3s) -> advance to video
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    // 7 seconds for video -> loop to table
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("advances only via durationSeconds timer (no onVideoEnd/onGalleryEnd)", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 3 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 5 },
      { id: 3, type: "gallery", title: "G1", description: "", durationSeconds: 4 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // Advance 3s (table durationSeconds) -> video
    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    // Advance 5s (video durationSeconds) -> gallery
    await act(async () => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();

    // Advance 4s (gallery durationSeconds) -> loop to table
    await act(async () => vi.advanceTimersByTime(4000));
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("no data shows fallback message instead of white screen", () => {
    mockCarouselState.data = [];
    mockCarouselState.loading = false;

    render(<CarrouselWrapper />);
    expect(screen.getByText("No hay datos")).toBeInTheDocument();
  });

  it("refetch (new data reference) does NOT reset timer - durationSeconds still obeyed", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 5 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 3 },
    ];
    const { rerender } = render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // 2s into 5s slide
    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // Simulate 60s refetch - new array ref, same content (does not reset timer)
    mockCarouselState.simulateRefetch = true;
    rerender(<CarrouselWrapper />);

    // Advance remaining 3s -> should advance to video (total 5s elapsed)
    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("uses 10s fallback when durationSeconds is missing or invalid", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "" /* no durationSeconds */ },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 2 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // 8s - still on table (fallback 10s)
    await act(async () => vi.advanceTimersByTime(8000));
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // +2s (total 10s) -> advance to video
    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("parses durationSeconds when provided as string (from API)", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: "4" } as unknown as CarouselRow,
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 2 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(4000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("consecutive slides with same durationSeconds each advance correctly", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 3 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 3 },
      { id: 3, type: "gallery", title: "G1", description: "", durationSeconds: 3 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("table-slide")).toBeInTheDocument(); // loop back

    vi.useRealTimers();
  });

  it("obeys real-world durations from Excel (300s, 120s, 601s)", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "Horario", description: "", durationSeconds: 300 },
      { id: 2, type: "table", title: "Horario 2", description: "", durationSeconds: 120 },
      { id: 3, type: "video", title: "Video", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 601 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(300000)); // 300s
    expect(screen.getByTestId("table-slide")).toBeInTheDocument(); // second table

    await act(async () => vi.advanceTimersByTime(120000)); // 120s
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(601000)); // 601s
    expect(screen.getByTestId("table-slide")).toBeInTheDocument(); // loop back

    vi.useRealTimers();
  });

  it("manual next restarts timer with new slide duration", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 10 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 3 },
    ];
    render(<CarrouselWrapper />);

    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // Click next before 10s elapsed
    await act(async () => {
      screen.getByTitle("Siguiente").click();
    });
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    // Timer restarted with video duration (3s) -> after 3s should loop to table
    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("manual prev restarts timer with new slide duration", async () => {
    vi.useFakeTimers();
    mockCarouselState.data = [
      { id: 1, type: "table", title: "T1", description: "", durationSeconds: 5 },
      { id: 2, type: "video", title: "V1", description: "", youtubeLink: "https://youtu.be/x", durationSeconds: 4 },
    ];
    render(<CarrouselWrapper />);

    await act(async () => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    await act(async () => {
      screen.getByTitle("Anterior").click();
    });
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();

    // Timer restarted with table duration (5s)
    await act(async () => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
