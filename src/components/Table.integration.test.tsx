import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act, within } from "@testing-library/react";
import type { CheckinData } from "@/types/Table.type";
import TableComponent from "./Table.component";

/**
 * Integration tests: Table + real PlatformsMap.
 * Verifies that clients are rendered in fecha_creacion order on the main route
 * (platform assignment by fecha_creacion, not fila).
 */

const createCheckinResponse = (classes: CheckinData["data"]["classes"]): CheckinData => ({
  data: {
    classes,
    date: "07-02-2025",
    scrapedAt: "2025-02-07T12:00:00",
    totalClasses: Object.keys(classes).length,
  },
  date: "07-02-2025",
});

describe("Table.component integration (fecha_creacion platform assignment)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-07T08:30:00")); // 8:30am — within 08:00-09:00
    global.fetch = vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/health")) {
        return Promise.resolve({ ok: true } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            createCheckinResponse({
              "Sesión semiprivada 8:00 am - 08:00 a 09:00 - Presencial": {
                classId: "1",
                class: "Sesión semiprivada 8:00 am - 08:00 a 09:00 - Presencial",
                limite: 5,
                reservations: [
                  {
                    id: 1024566,
                    reserva_id: 29408419,
                    hash_reserva_id: "p4QNk9xN0a",
                    name: "Paty",
                    last_name: "Aquino",
                    full_name: "Paty Aquino",
                    email: "p@t.com",
                    telefono: "",
                    status: "activo",
                    nombre_plan: "Semiprivadas",
                    canal: "members",
                    fecha_creacion: "12/02 01:39:05",
                    pago_pendiente: false,
                    form_asistencia_url: false,
                    mostrar_formulario: false,
                    rating: null,
                    imagen: "",
                    fila: "1",
                  },
                  {
                    id: 941539,
                    reserva_id: 29441395,
                    hash_reserva_id: "vLX5xd9d4E",
                    name: "Roxana",
                    last_name: "Cuadra",
                    full_name: "Roxana Cuadra",
                    email: "r@t.com",
                    telefono: "",
                    status: "activo",
                    nombre_plan: "Semiprivadas",
                    canal: "members",
                    fecha_creacion: "13/02 15:28:08",
                    pago_pendiente: false,
                    form_asistencia_url: false,
                    mostrar_formulario: false,
                    rating: null,
                    imagen: "",
                    fila: "5",
                  },
                  {
                    id: 884513,
                    reserva_id: 29355891,
                    hash_reserva_id: "x0Jr1xrA0v",
                    name: "Mariam",
                    last_name: "Heded de Alba",
                    full_name: "Mariam Heded de Alba",
                    email: "m@t.com",
                    telefono: "",
                    status: "activo",
                    nombre_plan: "Semiprivadas",
                    canal: "members",
                    fecha_creacion: "10/02 06:04:29",
                    pago_pendiente: false,
                    form_asistencia_url: false,
                    mostrar_formulario: false,
                    rating: null,
                    imagen: "",
                    fila: "2",
                  },
                  {
                    id: 884552,
                    reserva_id: 29438719,
                    hash_reserva_id: "p4QNkgnG0a",
                    name: "Vinicio",
                    last_name: "Estrada",
                    full_name: "Vinicio Estrada",
                    email: "v@t.com",
                    telefono: "",
                    status: "activo",
                    nombre_plan: "Semiprivadas",
                    canal: "members",
                    fecha_creacion: "13/02 13:08:36",
                    pago_pendiente: false,
                    form_asistencia_url: false,
                    mostrar_formulario: false,
                    rating: null,
                    imagen: "",
                    fila: "3",
                  },
                ],
                totalReservations: 4,
              },
            }),
          ),
      } as Response);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.setSystemTime(undefined);
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("renders clients on platforms in fecha_creacion order (oldest → platform 1)", async () => {
    render(<TableComponent />);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Order by fecha_creacion: Mariam (10/02) → 1, Paty (12/02) → 2, Vinicio (13/02 13:08) → 3, Roxana (13/02 15:28) → 4
    const map = screen.getByTestId("platforms-map");
    const getPlatformContainer = (el: HTMLElement) => el.parentElement?.parentElement?.parentElement;
    expect(getPlatformContainer(within(map).getByText("01"))?.textContent).toContain("Mariam");
    expect(getPlatformContainer(within(map).getByText("02"))?.textContent).toContain("Paty");
    expect(getPlatformContainer(within(map).getByText("03"))?.textContent).toContain("Vinicio");
    expect(getPlatformContainer(within(map).getByText("04"))?.textContent).toContain("Roxana");
  });

  it("ignores fila — Mariam has fila 2 but gets platform 1 (oldest fecha_creacion)", async () => {
    render(<TableComponent />);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const map = screen.getByTestId("platforms-map");
    const platform1 = within(map).getByText("01").parentElement?.parentElement?.parentElement;
    expect(platform1?.textContent).toContain("Mariam");
  });
});
