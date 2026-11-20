import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { CheckinData } from "@/types/Table.type";
import TableComponent, { __resetCheckinCacheForTests } from "./Table.component";

/**
 * The carousel remounts the table slide on every loop. These tests cover what the
 * TV shows when the check-in server is slow, down or returns garbage — it must keep
 * the running class on screen and never go blank.
 */

vi.mock("./PlatformsMap.component", () => ({
  default: ({ reservations }: { reservations: unknown[] }) => (
    <div data-testid="platforms-map">{reservations?.length ?? 0}</div>
  ),
}));

const CLASS_NAME = "Sesión grupal 6:00 am";

const checkinResponse = (): CheckinData =>
  ({
    data: {
      classes: {
        "06:00 a 07:00": {
          classId: "1",
          class: CLASS_NAME,
          limite: 10,
          reservations: [],
          totalReservations: 0,
        },
      },
      date: "06-02-2025",
      scrapedAt: "2025-02-06T06:00:00",
      totalClasses: 1,
    },
    date: "06-02-2025",
  }) as unknown as CheckinData;

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
const httpError = (status: number, body: unknown = {}) =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response);

const flush = () => act(async () => void (await vi.advanceTimersByTimeAsync(0)));
const advance = (ms: number) =>
  act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

const checkinCalls = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls.filter(([url]) => String(url).includes("/api/checkin/"));

const expectDarkAndNotBlank = (container: HTMLElement) => {
  const root = container.firstChild as HTMLElement | null;
  expect(root).not.toBeNull();
  expect(root?.style.backgroundColor).toBe("rgb(26, 26, 26)");
  expect(root?.style.minHeight).toBe("100vh");
  expect((root?.textContent ?? "").trim().length).toBeGreaterThan(0);
};

describe("Table slide resilience", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetCheckinCacheForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-06T06:30:00")); // mid-class (06:00–07:00)
    fetchMock = vi.fn(() => ok(checkinResponse()));
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  /** One full first visit of the table slide, then the carousel moves on. */
  const firstVisit = async () => {
    const view = render(<TableComponent />);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
    view.unmount();
  };

  it("first visit: dark loading screen, then the running class", async () => {
    const { container } = render(<TableComponent />);
    expect(screen.getByText("Cargando datos...")).toBeInTheDocument();
    expectDarkAndNotBlank(container);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("next loop: the class is on screen immediately, with no loading screen", async () => {
    await firstVisit();
    await advance(5 * 60_000); // other slides play
    vi.setSystemTime(new Date("2025-02-06T06:36:00"));

    const { container } = render(<TableComponent />);
    // synchronously, before any network answer
    expect(screen.queryByText("Cargando datos...")).toBeNull();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("next loop refreshes in the background when the data is older than a minute", async () => {
    await firstVisit();
    expect(checkinCalls(fetchMock)).toHaveLength(1);
    await advance(2 * 60_000);
    render(<TableComponent />);
    await flush();
    expect(checkinCalls(fetchMock)).toHaveLength(2);
  });

  it("does not hammer the server when the slide comes back within a minute", async () => {
    await firstVisit();
    await advance(20_000);
    render(<TableComponent />);
    await flush();
    expect(checkinCalls(fetchMock)).toHaveLength(1);
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });

  it("server down on the next loop (mid-class): keeps showing the class", async () => {
    await firstVisit();
    await advance(5 * 60_000);
    vi.setSystemTime(new Date("2025-02-06T06:36:00"));
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));

    const { container } = render(<TableComponent />);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
    expect(screen.queryByText("Sin sesión activa")).toBeNull();
    expectDarkAndNotBlank(container);
  });

  it("server returns HTTP 500 on the next loop: keeps showing the class", async () => {
    await firstVisit();
    await advance(5 * 60_000);
    vi.setSystemTime(new Date("2025-02-06T06:36:00"));
    fetchMock.mockImplementation(() => httpError(500));

    render(<TableComponent />);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });

  it("server asleep (request never answers): class shown immediately, no endless loading", async () => {
    await firstVisit();
    await advance(5 * 60_000);
    vi.setSystemTime(new Date("2025-02-06T06:36:00"));
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(<TableComponent />);
    await advance(60_000);
    expect(screen.queryByText("Cargando datos...")).toBeNull();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });

  it("5-minute refresh failing while the slide is on screen keeps the class", async () => {
    render(<TableComponent />);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();

    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    vi.setSystemTime(new Date("2025-02-06T06:36:00"));
    await advance(5 * 60_000);
    expect(screen.queryByText("Cargando datos...")).toBeNull();
    expect(screen.queryByText("Sin sesión activa")).toBeNull();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });

  it("server down from the very start: dark 'Sin sesión activa' screen, then recovers on a later loop", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    const first = render(<TableComponent />);
    await flush();
    expect(screen.getByText("Sin sesión activa")).toBeInTheDocument();
    expectDarkAndNotBlank(first.container);
    first.unmount();

    fetchMock.mockImplementation(() => ok(checkinResponse()));
    render(<TableComponent />);
    await flush();
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });

  it("server says 'No data available': dark empty-session screen, not a crash", async () => {
    fetchMock.mockImplementation(() =>
      httpError(404, { error: "No data available" }),
    );
    const { container } = render(<TableComponent />);
    await flush();
    expect(screen.getByText("Sin sesión activa")).toBeInTheDocument();
    expect(screen.getByTestId("platforms-map")).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("never shows yesterday's class after midnight, even if today's fetch fails", async () => {
    await firstVisit();
    vi.setSystemTime(new Date("2025-02-07T06:30:00")); // same hour, next day
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));

    const { container } = render(<TableComponent />);
    expect(screen.queryByText(CLASS_NAME)).toBeNull();
    await flush();
    expect(screen.queryByText(CLASS_NAME)).toBeNull();
    expect(screen.getByText("Sin sesión activa")).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("day changes while the slide is on screen and the refresh fails: yesterday's class is dropped", async () => {
    vi.setSystemTime(new Date("2025-02-06T23:58:00"));
    fetchMock.mockImplementation(() =>
      ok({
        data: {
          classes: {
            "23:00 a 00:30": {
              classId: "9",
              class: "Clase nocturna",
              limite: 10,
              reservations: [],
              totalReservations: 0,
            },
          },
        },
      }),
    );
    render(<TableComponent />);
    await flush();
    expect(screen.getByText("Clase nocturna")).toBeInTheDocument();

    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    vi.setSystemTime(new Date("2025-02-07T00:03:00"));
    await advance(5 * 60_000);
    expect(screen.queryByText("Clase nocturna")).toBeNull();
    expect(screen.getByText("Sin sesión activa")).toBeInTheDocument();
  });

  it.each([
    ["null body", null],
    ["empty object", {}],
    ["data without classes", { data: {} }],
    ["classes is null", { data: { classes: null } }],
    ["classes is a string", { data: { classes: "oops" } }],
    ["classes is an array of junk", { data: { classes: [null, 5, "x"] } }],
    [
      "class entries are null",
      { data: { classes: { "06:00 a 07:00": null, other: undefined } } },
    ],
    [
      "reservations is not an array",
      {
        data: {
          classes: {
            "06:00 a 07:00": { class: CLASS_NAME, reservations: "nope" },
          },
        },
      },
    ],
  ])("garbage from the server (%s) renders a dark screen instead of crashing", async (_label, body) => {
    fetchMock.mockImplementation(() => ok(body));
    const { container } = render(<TableComponent />);
    await flush();
    expect(screen.getByTestId("tv-schedule-root")).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("response body that is not JSON: dark screen, no crash", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      } as Response),
    );
    const { container } = render(<TableComponent />);
    await flush();
    expect(screen.getByTestId("tv-schedule-root")).toBeInTheDocument();
    expectDarkAndNotBlank(container);
  });

  it("slide unmounting while a request is in flight does not throw", async () => {
    let resolve: (r: Response) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const { unmount } = render(<TableComponent />);
    unmount();
    resolve({ ok: true, json: () => Promise.resolve(checkinResponse()) } as Response);
    await flush();
    // and the answer is still kept for the next loop
    render(<TableComponent />);
    expect(screen.getByText(CLASS_NAME)).toBeInTheDocument();
  });
});
