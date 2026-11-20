import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

const safeReload = vi.fn();
vi.mock("@/utils/recovery", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/recovery")>("@/utils/recovery");
  return { ...actual, safeReload: (reason: string) => safeReload(reason) };
});

import { CarouselSlideErrorBoundary } from "./CarouselSlideErrorBoundary";
import { ErrorBoundary } from "./ErrorBoundary.component";
import { TableErrorBoundary } from "./TableErrorBoundary";

/** Throws while `shouldThrow.current` is true — lets a test "fix" the child later. */
const makeBomb = (error: Error = new Error("render crash")) => {
  const shouldThrow = { current: true };
  const Bomb = () => {
    if (shouldThrow.current) throw error;
    return <div data-testid="healthy-child">ok</div>;
  };
  return { Bomb, shouldThrow };
};

const isDark = (el: HTMLElement) => {
  const bg = el.style.backgroundColor;
  const cls = el.className ?? "";
  return (
    bg === "rgb(26, 26, 26)" ||
    bg === "rgb(15, 20, 25)" ||
    cls.includes("bg-[#0f1419]")
  );
};

describe("TableErrorBoundary (page-level, wraps the whole carousel)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    safeReload.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows a dark full-height fallback instead of an empty (white) page", () => {
    const { Bomb } = makeBomb();
    const { container } = render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    const fallback = container.firstChild as HTMLElement;
    expect(fallback).not.toBeNull();
    expect(isDark(fallback)).toBe(true);
    expect(fallback.style.minHeight).toBe("100vh");
  });

  it("does not stay stuck: re-renders the carousel after 10s", () => {
    const { Bomb, shouldThrow } = makeBomb();
    render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    expect(screen.queryByTestId("healthy-child")).toBeNull();

    shouldThrow.current = false; // transient problem is gone
    act(() => void vi.advanceTimersByTime(9_999));
    expect(screen.queryByTestId("healthy-child")).toBeNull();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
    expect(safeReload).not.toHaveBeenCalled();
  });

  it("keeps a dark screen through repeated crashes and safe-reloads after 5 in a row", () => {
    const { Bomb } = makeBomb(); // never recovers
    const { container } = render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    for (let i = 1; i <= 4; i++) {
      act(() => void vi.advanceTimersByTime(10_000));
      expect(isDark(container.firstChild as HTMLElement)).toBe(true);
      expect(safeReload).not.toHaveBeenCalled();
    }
    act(() => void vi.advanceTimersByTime(10_000));
    expect(safeReload).toHaveBeenCalledWith("carousel kept crashing");
    expect(isDark(container.firstChild as HTMLElement)).toBe(true);
  });

  it("forgets old crashes after a healthy minute (occasional errors never force a reload)", () => {
    const { Bomb, shouldThrow } = makeBomb();
    const { rerender } = render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    // 8 isolated crashes, each followed by more than a minute of healthy running
    for (let i = 0; i < 8; i++) {
      shouldThrow.current = false;
      act(() => void vi.advanceTimersByTime(10_000)); // auto-reset → healthy
      expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
      act(() => void vi.advanceTimersByTime(61_000));
      shouldThrow.current = true;
      rerender(
        <TableErrorBoundary>
          <Bomb />
        </TableErrorBoundary>,
      );
      expect(screen.queryByTestId("healthy-child")).toBeNull();
    }
    expect(safeReload).not.toHaveBeenCalled();
  });

  it("chunk load error: asks for a safe reload right away", () => {
    const { Bomb } = makeBomb(
      Object.assign(new Error("Loading chunk 3 failed"), {
        name: "ChunkLoadError",
      }),
    );
    render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    expect(safeReload).toHaveBeenCalledWith("chunk load error in carousel");
  });

  it("clears its timers on unmount", () => {
    const { Bomb } = makeBomb();
    const { unmount } = render(
      <TableErrorBoundary>
        <Bomb />
      </TableErrorBoundary>,
    );
    unmount();
    expect(() => act(() => void vi.advanceTimersByTime(120_000))).not.toThrow();
    expect(safeReload).not.toHaveBeenCalled();
  });
});

describe("CarouselSlideErrorBoundary / ErrorBoundary fallbacks", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("slide boundary shows a dark full-height fallback", () => {
    const { Bomb } = makeBomb();
    render(
      <CarouselSlideErrorBoundary>
        <Bomb />
      </CarouselSlideErrorBoundary>,
    );
    const fallback = screen.getByTestId("carousel-slide-error");
    expect(isDark(fallback)).toBe(true);
    expect(fallback.style.minHeight).toBe("100vh");
  });

  it("slide boundary recovers when the slide changes (new key)", () => {
    const { Bomb, shouldThrow } = makeBomb();
    const { rerender } = render(
      <CarouselSlideErrorBoundary key="slide-0">
        <Bomb />
      </CarouselSlideErrorBoundary>,
    );
    expect(screen.getByTestId("carousel-slide-error")).toBeInTheDocument();
    shouldThrow.current = false;
    rerender(
      <CarouselSlideErrorBoundary key="slide-1">
        <Bomb />
      </CarouselSlideErrorBoundary>,
    );
    expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
  });

  it("generic ErrorBoundary shows a dark full-height fallback", () => {
    const { Bomb } = makeBomb();
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    const fallback = container.firstChild as HTMLElement;
    expect(isDark(fallback)).toBe(true);
    expect(fallback.style.minHeight).toBe("100vh");
  });
});
