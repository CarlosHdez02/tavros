import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

// biome-ignore lint/suspicious/noExplicitAny: captured props of a mocked third-party player
type PlayerProps = Record<string, any>;
const youtubeProps: PlayerProps[] = [];
vi.mock("react-youtube", () => ({
  default: (props: PlayerProps) => {
    youtubeProps.push(props);
    return <div data-testid="youtube-player" data-video-id={props.videoId} />;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: unknown; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: test stub
    <img data-testid="gallery-image" alt={alt} data-has-src={String(Boolean(src))} />
  ),
}));

import { ImageGallery } from "@/mockData/Gallery.mock";
import Gallery from "./Gallery.component";
import SingleVideo from "./Video-cards.component";

describe("Video slide", () => {
  beforeEach(() => {
    youtubeProps.length = 0;
  });

  it.each([
    ["https://www.youtube.com/watch?v=abc123", "abc123"],
    ["https://youtu.be/abc123", "abc123"],
    ["https://youtube.com/shorts/abc123", "abc123"],
    ["https://www.youtube.com/embed/abc123", "abc123"],
    ["https://www.youtube.com/watch?v=abc123&list=PL1", "abc123"],
    ["youtu.be/abc123", "abc123"],
    ["  https://youtu.be/abc123  ", "abc123"],
  ])("plays %s", (link, id) => {
    render(<SingleVideo youtubeLink={link} />);
    expect(screen.getByTestId("youtube-player")).toHaveAttribute(
      "data-video-id",
      id,
    );
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty", ""],
    ["spaces", "   "],
    ["not a url", "ht!tp://%%%"],
    ["a non-video page", "https://www.youtube.com/"],
    ["a number from the sheet", 12345 as unknown as string],
  ])("bad link (%s) shows a dark placeholder instead of crashing or a blank player", (_label, link) => {
    const { container } = render(<SingleVideo youtubeLink={link} />);
    expect(screen.queryByTestId("youtube-player")).toBeNull();
    expect(screen.getByText(/Video not available/)).toBeInTheDocument();
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("bg-[#0f1419]");
    expect(root.className).toContain("h-screen");
  });

  it("always wraps the player in a full-screen dark container", () => {
    const { container } = render(
      <SingleVideo youtubeLink="https://youtu.be/abc123" />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("bg-[#0f1419]");
    expect(root.className).toContain("h-screen");
  });

  it("player callbacks survive a player whose API calls throw (TV browsers)", () => {
    render(<SingleVideo youtubeLink="https://youtube.com/shorts/abc123" />);
    const props = youtubeProps[youtubeProps.length - 1];
    const brokenPlayer = {
      setPlaybackQuality: () => {
        throw new Error("not supported");
      },
      getIframe: () => {
        throw new Error("iframe gone");
      },
    };
    expect(() => props.onReady({ target: brokenPlayer })).not.toThrow();
    expect(() =>
      props.onStateChange({ data: 1, target: brokenPlayer }),
    ).not.toThrow();
    expect(() =>
      props.onStateChange({ data: 0, target: brokenPlayer }),
    ).not.toThrow();
  });
});

describe("Gallery slide", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ["0", 0],
    ["last", ImageGallery.length - 1],
    ["far past the end", 9_999],
    ["negative", -3],
    ["NaN", Number.NaN],
    ["undefined", undefined],
    ["a string", "2" as unknown as number],
  ])("externalIndex %s always resolves to a real image", (_label, idx) => {
    render(<Gallery externalIndex={idx} />);
    expect(screen.getByTestId("gallery-image")).toHaveAttribute(
      "data-has-src",
      "true",
    );
  });

  it("cycles through its pictures for a long time and always has an image", () => {
    render(<Gallery externalIndex={0} />);
    for (let i = 0; i < ImageGallery.length * 20; i++) {
      act(() => void vi.advanceTimersByTime(4_000));
      expect(screen.getByTestId("gallery-image")).toHaveAttribute(
        "data-has-src",
        "true",
      );
    }
  });
});

describe("global CSS guards against white flashes", () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, "../app/globals.css"),
    "utf8",
  );

  it("iframes (YouTube) get a dark background and no color-scheme mismatch", () => {
    const rule = css.match(/(^|\n)iframe\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule?.[2]).toMatch(/background-color:\s*#0f1419/i);
    expect(rule?.[2]).toMatch(/color-scheme:\s*normal/);
  });

  it("root layout paints html and body dark before any JS runs", () => {
    const layout = fs.readFileSync(
      path.resolve(__dirname, "../app/layout.tsx"),
      "utf8",
    );
    expect(layout).toMatch(/<html[^>]*bg-\[#0f1419\]/);
    expect(layout).toMatch(/<body[\s\S]*?bg-\[#0f1419\]/);
  });
});
