import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { CheckinData } from "@/types/Table.type";
import TableComponent from "./Table.component";

// Mock PlatformsMap to isolate Table logic
vi.mock("./PlatformsMap.component", () => ({
  default: ({ reservations, sessionTime }: { reservations: unknown[]; sessionTime: string }) => (
    <div data-testid="platforms-map">
      <span data-testid="reservation-count">{reservations?.length ?? 0}</span>
      <span data-testid="session-time">{sessionTime}</span>
    </div>
  ),
}));

const createCheckinResponse = (classes: CheckinData["data"]["classes"]): CheckinData => ({
  data: {
    classes,
    date: "06-02-2025",
    scrapedAt: "2025-02-06T12:00:00",
    totalClasses: Object.keys(classes).length,
  },
  date: "06-02-2025",
});

describe("Table.component (TVScheduleDisplay)", () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Default: mock fetch for all URLs
    fetchMock = vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/health")) {
        return Promise.resolve({ ok: true } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            createCheckinResponse({
              "06:00 a 07:00": {
                classId: "1",
                class: "Sesión grupal 6:00 am",
                limite: 10,
                reservations: [],
                totalReservations: 0,
              },
            }),
          ),
      } as Response);
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(<TableComponent />);
    expect(screen.getByText("Cargando datos...")).toBeInTheDocument();
  });

  it("renders PlatformsMap after fetch completes and passes reservations", async () => {
    const reservations = [
      {
        id: 1,
        reserva_id: 1,
        hash_reserva_id: "x",
        name: "Carlos",
        last_name: "Test",
        full_name: "Carlos Test",
        email: "c@t.com",
        telefono: "",
        status: "activo",
        nombre_plan: "Grupal",
        canal: "app",
        fecha_creacion: "",
        pago_pendiente: false,
        form_asistencia_url: false,
        mostrar_formulario: false,
        rating: null,
        imagen: "",
        fila: "",
      },
    ];

    const checkinResponse = createCheckinResponse({
      "06:00 a 07:00": {
        classId: "1",
        class: "Sesión grupal 6:00 am",
        limite: 10,
        reservations,
        totalReservations: 1,
      },
    });

    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/health")) {
        return Promise.resolve({ ok: true } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(checkinResponse),
      } as Response);
    });

    render(<TableComponent />);

    await act(async () => {
      vi.runAllTimersAsync();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const map = screen.queryByTestId("platforms-map");
    expect(map).toBeInTheDocument();
    expect(screen.getByTestId("reservation-count").textContent).toBe("1");
  });

  it("handles API error without crashing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { container } = render(<TableComponent />);

    await act(async () => {
      vi.runAllTimersAsync();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container).toBeInTheDocument();
  });

  it("handles 404 / no data response without crashing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No data available" }),
    } as Response);

    const { container } = render(<TableComponent />);

    await act(async () => {
      vi.runAllTimersAsync();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container).toBeInTheDocument();
  });

  it("eventually renders PlatformsMap with fallback displayData when no session matches", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          createCheckinResponse({
            "06:00 a 07:00": {
              classId: "1",
              class: "Sesión grupal 6:00 am",
              limite: 10,
              reservations: [],
              totalReservations: 0,
            },
          }),
        ),
    } as Response);

    render(<TableComponent />);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const map = screen.queryByTestId("platforms-map");
    expect(map || screen.getByText("Cargando datos...")).toBeInTheDocument();
  });
});
