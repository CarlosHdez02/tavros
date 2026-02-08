import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { CarouselRow } from "@/hooks/useCarouselData";

// Mutable state for useCarouselData mock - tests set this before rendering
const mockCarouselState = {
  data: [] as CarouselRow[],
  loading: false,
};

vi.mock("@/hooks/useCarouselData", () => ({
  useCarouselData: () => mockCarouselState,
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

const createMockData = (overrides: Partial<CarouselRow>[] = []): CarouselRow[] => [
  { id: 1, type: "table", title: "Table", description: "", durationSeconds: 5 },
  { id: 2, type: "video", title: "Video", description: "", youtubeLink: "https://youtube.com/watch?v=x", durationSeconds: 8 },
  { id: 3, type: "gallery", title: "Gallery", description: "", durationSeconds: 12 },
  ...overrides,
];

describe("CarrouselWrapper", () => {
  beforeEach(() => {
    mockCarouselState.data = createMockData();
    mockCarouselState.loading = false;
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

  it("no data shows fallback message instead of white screen", () => {
    mockCarouselState.data = [];
    mockCarouselState.loading = false;

    render(<CarrouselWrapper />);
    expect(screen.getByText("No hay datos")).toBeInTheDocument();
  });
});
