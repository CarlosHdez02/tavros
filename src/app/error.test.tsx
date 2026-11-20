import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

const safeReload = vi.fn();
vi.mock("@/utils/recovery", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/recovery")>("@/utils/recovery");
  return { ...actual, safeReload: (reason: string) => safeReload(reason) };
});

import GlobalError from "./global-error";
import RouteError from "./error";

const DARK = "rgb(15, 20, 25)"; // #0f1419

describe("app/error.tsx (replaces Next's white 'Application error' page)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    safeReload.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a full-height dark screen, never white", () => {
    const { container } = render(
      <RouteError error={new Error("boom")} reset={() => {}} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.backgroundColor).toBe(DARK);
    expect(root.style.minHeight).toBe("100vh");
    expect(root.textContent).toContain("Actualizando");
  });

  it("recovers by itself: calls reset after 5s without anyone touching the TV", () => {
    const reset = vi.fn();
    render(<RouteError error={new Error("boom")} reset={reset} />);
    act(() => void vi.advanceTimersByTime(4_999));
    expect(reset).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(safeReload).not.toHaveBeenCalled();
  });

  it("falls back to a safe reload if the error screen is still up after 60s", () => {
    render(<RouteError error={new Error("boom")} reset={() => {}} />);
    act(() => void vi.advanceTimersByTime(59_999));
    expect(safeReload).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(safeReload).toHaveBeenCalledTimes(1);
  });

  it("safe-reloads if reset itself throws", () => {
    const reset = vi.fn(() => {
      throw new Error("reset failed");
    });
    render(<RouteError error={new Error("boom")} reset={reset} />);
    act(() => void vi.advanceTimersByTime(5_000));
    expect(safeReload).toHaveBeenCalledWith("route reset failed");
  });

  it("chunk load error (new deployment): safe-reloads instead of resetting into the same failure", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("Loading chunk 7 failed"), {
      name: "ChunkLoadError",
    });
    render(<RouteError error={error} reset={reset} />);
    expect(safeReload).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(120_000));
    expect(reset).not.toHaveBeenCalled();
  });

  it("cancels its timers when it unmounts (recovered)", () => {
    const reset = vi.fn();
    const { unmount } = render(
      <RouteError error={new Error("boom")} reset={reset} />,
    );
    unmount();
    act(() => void vi.advanceTimersByTime(120_000));
    expect(reset).not.toHaveBeenCalled();
    expect(safeReload).not.toHaveBeenCalled();
  });
});

describe("app/global-error.tsx (errors in the root layout)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    safeReload.mockClear();
    // React warns about <html> inside the test container; irrelevant here
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** GlobalError renders its own <html>, so mount it as the document itself. */
  const renderGlobal = (reset: () => void) =>
    render(<GlobalError error={new Error("boom")} reset={reset} />, {
      container: document,
      baseElement: document.documentElement,
    });

  it("renders its own dark <html> and <body>", () => {
    const { unmount } = renderGlobal(() => {});
    expect(document.documentElement.style.backgroundColor).toBe(DARK);
    expect(document.body.style.backgroundColor).toBe(DARK);
    expect(document.body.style.minHeight).toBe("100vh");
    expect(document.body.textContent).toContain("Actualizando");
    unmount();
  });

  it("tries reset after 5s, then a safe reload after 30s", () => {
    const reset = vi.fn();
    const { unmount } = renderGlobal(reset);
    act(() => void vi.advanceTimersByTime(5_000));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(safeReload).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(25_000));
    expect(safeReload).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("still reloads when reset throws", () => {
    const reset = vi.fn(() => {
      throw new Error("reset failed");
    });
    const { unmount } = renderGlobal(reset);
    act(() => void vi.advanceTimersByTime(30_000));
    expect(safeReload).toHaveBeenCalledTimes(1);
    unmount();
  });
});
