import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { CarouselRow } from "@/hooks/useCarouselData";

/**
 * "Never a blank screen" tests: whatever happens to slides or data, the carousel
 * must keep a dark, non-empty screen and keep looping.
 */

const mockState = {
  rows: [] as CarouselRow[] | undefined,
  isLoading: false,
  isError: false,
};

vi.mock("@/hooks/useCarouselData", () => ({
  useCarouselData: () => ({
    data:
      mockState.rows === undefined
        ? undefined
        : { all: mockState.rows, table: [], videos: [], gallery: [] },
    isLoading: mockState.isLoading,
    isError: mockState.isError,
  }),
}));

const crash = { table: false, gallery: false, video: false };

vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<unknown>) => {
    const src = importFn.toString();
    if (src.includes("Table"))
      return () => {
        if (crash.table) throw new Error("table slide crashed");
        return <div data-testid="table-slide">Table</div>;
      };
    if (src.includes("Gallery"))
      return () => {
        if (crash.gallery) throw new Error("gallery slide crashed");
        return <div data-testid="gallery-slide">Gallery</div>;
      };
    return () => null;
  },
}));

vi.mock("./Video-cards.component", () => ({
  default: () => {
    if (crash.video) throw new Error("video slide crashed");
    return <div data-testid="video-slide">Video</div>;
  },
}));

const safeReload = vi.fn();
vi.mock("@/utils/recovery", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/recovery")>("@/utils/recovery");
  return { ...actual, safeReload: (reason: string) => safeReload(reason) };
});

import CarrouselWrapper from "./Carroussel.component";

const rows = (): CarouselRow[] => [
  { id: 1, type: "table", title: "T", description: "", durationSeconds: 5 },
  {
    id: 2,
    type: "video",
    title: "V",
    description: "",
    youtubeLink: "https://youtube.com/watch?v=x",
    durationSeconds: 8,
  },
  { id: 3, type: "gallery", title: "G", description: "", durationSeconds: 12 },
];

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const currentIndex = () =>
  Number(screen.getByTestId("carousel-root").getAttribute("data-carousel-index"));

/** The screen is "not blank" when something dark with visible content is mounted. */
const expectNotBlank = (container: HTMLElement) => {
  const root = container.firstChild as HTMLElement | null;
  expect(root).not.toBeNull();
  expect(root?.className).toContain("bg-[#0f1419]");
  expect((root?.textContent ?? "").trim().length).toBeGreaterThan(0);
};

describe("Carousel resilience — never a blank screen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T06:00:00"));
    mockState.rows = rows();
    mockState.isLoading = false;
    mockState.isError = false;
    crash.table = crash.gallery = crash.video = false;
    safeReload.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loops for hours: every stage shown for its sheet duration, then starts again", () => {
    const { container } = render(<CarrouselWrapper />);
    const order = ["table-slide", "video-slide", "gallery-slide"];
    const durations = [5_000, 8_000, 12_000];
    // 300 full loops = 2.5 hours of display time
    for (let loop = 0; loop < 300; loop++) {
      for (let i = 0; i < order.length; i++) {
        expect(currentIndex()).toBe(i);
        expect(screen.getByTestId(order[i])).toBeInTheDocument();
        expectNotBlank(container);
        advance(durations[i] - 100);
        expect(currentIndex()).toBe(i); // not early
        advance(100);
      }
    }
    expect(currentIndex()).toBe(0);
    expect(safeReload).not.toHaveBeenCalled();
  });

  it("a crashing slide shows a dark fallback and the carousel moves on after its duration", () => {
    crash.table = true;
    const { container } = render(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
    expectNotBlank(container);

    advance(5_000);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
    advance(8_000);
    expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();
    advance(12_000);
    // back at the broken slide: still a dark fallback, still looping
    expect(currentIndex()).toBe(0);
    expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
    expectNotBlank(container);
  });

  it("a slide that crashed once works again on the next loop", () => {
    crash.video = true;
    render(<CarrouselWrapper />);
    advance(5_000);
    expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
    crash.video = false;
    advance(8_000);
    advance(12_000);
    advance(5_000);
    expect(currentIndex()).toBe(1);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
  });

  it("even if EVERY slide crashes, the screen stays dark and the loop keeps going", () => {
    crash.table = crash.video = crash.gallery = true;
    const { container } = render(<CarrouselWrapper />);
    const durations = [5_000, 8_000, 12_000];
    for (let step = 0; step < 30; step++) {
      expect(currentIndex()).toBe(step % 3);
      expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
      expectNotBlank(container);
      advance(durations[step % 3]);
    }
  });

  it("slide crashing in the middle of its time (mid-class) keeps a dark screen and still advances on schedule", () => {
    const { container, rerender } = render(<CarrouselWrapper />);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
    advance(2_000);
    crash.table = true;
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
    expectNotBlank(container);
    advance(2_999);
    expect(currentIndex()).toBe(0);
    advance(1);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
  });

  it("shows dark loading, then starts the carousel when data arrives", () => {
    mockState.rows = undefined;
    mockState.isLoading = true;
    const { container, rerender } = render(<CarrouselWrapper />);
    expectNotBlank(container);
    mockState.rows = rows();
    mockState.isLoading = false;
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
    advance(5_000);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
  });

  it("sheet fetch failed with nothing cached: dark error screen, and it starts when data arrives", () => {
    mockState.rows = undefined;
    mockState.isError = true;
    const { container, rerender } = render(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-error")).toBeInTheDocument();
    expectNotBlank(container);

    mockState.rows = rows();
    mockState.isError = false;
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
  });

  it("a failed background refetch does not interrupt the running carousel", () => {
    const { container, rerender } = render(<CarrouselWrapper />);
    advance(5_000);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
    mockState.isError = true; // refetch failed, last good data kept
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
    expectNotBlank(container);
    advance(8_000);
    expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();
    advance(12_000);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
  });

  it("empty sheet: dark 'No hay datos', and resumes when rows come back", () => {
    mockState.rows = [];
    const { container, rerender } = render(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-empty")).toBeInTheDocument();
    expectNotBlank(container);
    mockState.rows = rows();
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
    advance(5_000);
    expect(screen.getByTestId("video-slide")).toBeInTheDocument();
  });

  it("sheet with only unusable rows: dark 'No hay datos' instead of a blank slide", () => {
    mockState.rows = [
      { id: 1, type: "banner" as never, title: "", description: "" },
      { id: 2, type: "video", title: "", description: "", youtubeLink: "  " },
      null as unknown as CarouselRow,
    ];
    const { container } = render(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-empty")).toBeInTheDocument();
    expectNotBlank(container);
  });

  it("rows removed from the sheet while on the last slide: stays on a valid slide and keeps looping", () => {
    const { container, rerender } = render(<CarrouselWrapper />);
    advance(5_000);
    advance(8_000);
    expect(currentIndex()).toBe(2);

    mockState.rows = rows().slice(0, 1); // only the table row is left
    rerender(<CarrouselWrapper />);
    expect(currentIndex()).toBe(0);
    expect(screen.getByTestId("table-slide")).toBeInTheDocument();
    expectNotBlank(container);
    // single-slide carousel keeps "looping" onto itself without going blank
    for (let i = 0; i < 5; i++) {
      advance(5_000);
      expect(screen.getByTestId("table-slide")).toBeInTheDocument();
      expectNotBlank(container);
    }
  });

  it("sheet emptied mid-run then restored: shows 'No hay datos', then loops again", () => {
    const { container, rerender } = render(<CarrouselWrapper />);
    advance(5_000);
    mockState.rows = [];
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-empty")).toBeInTheDocument();
    expectNotBlank(container);
    advance(60_000);
    mockState.rows = rows();
    rerender(<CarrouselWrapper />);
    expect(screen.getByTestId("carousel-root")).toBeInTheDocument();
    const before = currentIndex();
    advance(12_000);
    expect(currentIndex()).not.toBe(before);
    expectNotBlank(container);
  });

  it("broken durations (0, negative, text, missing) fall back to 10s instead of freezing or spinning", () => {
    mockState.rows = [
      { id: 1, type: "table", title: "", description: "", durationSeconds: 0 },
      { id: 2, type: "gallery", title: "", description: "", durationSeconds: -5 },
      {
        id: 3,
        type: "table",
        title: "",
        description: "",
        durationSeconds: "abc" as unknown as number,
      },
      { id: 4, type: "gallery", title: "", description: "" },
    ];
    render(<CarrouselWrapper />);
    for (let step = 0; step < 8; step++) {
      expect(currentIndex()).toBe(step % 4);
      advance(9_900);
      expect(currentIndex()).toBe(step % 4);
      advance(100);
    }
  });

  describe("scheduled refresh (frees TV browser memory)", () => {
    it("does not reload during the first 6 hours", () => {
      render(<CarrouselWrapper />);
      vi.setSystemTime(Date.now() + 5.9 * 60 * 60 * 1000);
      for (let i = 0; i < 3; i++) {
        advance(5_000);
        advance(8_000);
        advance(12_000);
      }
      expect(safeReload).not.toHaveBeenCalled();
    });

    it("after 6 hours, waits for the loop to finish and only then requests a safe reload", () => {
      render(<CarrouselWrapper />);
      advance(5_000); // now on slide 1, mid-loop
      vi.setSystemTime(Date.now() + 6.1 * 60 * 60 * 1000);
      advance(8_000); // slide 2
      expect(currentIndex()).toBe(2);
      expect(safeReload).not.toHaveBeenCalled();
      advance(12_000); // loop complete → slide 0
      expect(currentIndex()).toBe(0);
      expect(safeReload).toHaveBeenCalledWith(
        "scheduled refresh after full loop",
      );
    });

    it("keeps looping normally while the reload is pending (e.g. server unreachable)", () => {
      const { container } = render(<CarrouselWrapper />);
      vi.setSystemTime(Date.now() + 7 * 60 * 60 * 1000);
      for (let loop = 0; loop < 5; loop++) {
        advance(5_000);
        expect(screen.getByTestId("video-slide")).toBeInTheDocument();
        advance(8_000);
        expect(screen.getByTestId("gallery-slide")).toBeInTheDocument();
        advance(12_000);
        expect(screen.getByTestId("table-slide")).toBeInTheDocument();
        expectNotBlank(container);
      }
      expect(safeReload).toHaveBeenCalled();
    });
  });
});
