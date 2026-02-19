import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Reservation } from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

const createMockReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: 1,
  reserva_id: 1,
  hash_reserva_id: "abc",
  name: "Juan",
  last_name: "Pérez",
  full_name: "Juan Pérez",
  email: "juan@test.com",
  telefono: "123",
  status: "activo",
  nombre_plan: "Grupal (Paquete Full)",
  canal: "app",
  fecha_creacion: "2025-01-01",
  pago_pendiente: false,
  form_asistencia_url: false,
  mostrar_formulario: false,
  rating: null,
  imagen: "default.jpg",
  fila: "1",
  ...overrides,
});

describe("PlatformsMap", () => {
  it("renders without crashing with empty reservations", () => {
    const { container } = render(<PlatformsMap reservations={[]} />);
    expect(container).toBeInTheDocument();
  });

  it("renders without crashing with null/undefined-safe empty array", () => {
    const { container } = render(<PlatformsMap reservations={[]} sessionTime="" />);
    expect(container).toBeInTheDocument();
  });

  it("renders with reservations and shows client names on platforms", () => {
    const reservations = [
      createMockReservation({ name: "Carlos", last_name: "Hernández", nombre_plan: "Grupal (Paquete Full)" }),
      createMockReservation({ name: "Ana", last_name: "García", nombre_plan: "Paquete de sesiones Privadas" }),
    ];
    render(<PlatformsMap reservations={reservations} sessionTime="06:00 - 07:00" />);

    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
  });

  it("renders occupied platform with client name and class type", () => {
    const reservations = [createMockReservation({ name: "Test", last_name: "User", nombre_plan: "Grupal" })];
    render(<PlatformsMap reservations={reservations} sessionTime="06:00 - 07:00" />);
    expect(screen.getByText(/Test/)).toBeInTheDocument();
    expect(screen.getByText("GRUPAL")).toBeInTheDocument();
  });

  it("renders occupied platform without session time when not provided", () => {
    const reservations = [createMockReservation({ name: "Test", last_name: "User" })];
    const { container } = render(<PlatformsMap reservations={reservations} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/Test/)).toBeInTheDocument();
  });

  it("renders empty platforms without Disponible text", () => {
    const { container } = render(<PlatformsMap reservations={[]} />);
    expect(container).toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
  });

  it("shows Entrada label", () => {
    render(<PlatformsMap reservations={[]} />);
    expect(screen.getByText("Entrada")).toBeInTheDocument();
  });

  it("handles reservations with empty or unknown nombre_plan without crashing", () => {
    const reservations = [
      createMockReservation({ nombre_plan: "" }),
      createMockReservation({ nombre_plan: "Unknown Plan Type" }),
    ];
    const { container } = render(<PlatformsMap reservations={reservations} />);
    expect(container).toBeInTheDocument();
  });

  it("handles many reservations (more than 10) and only assigns first 10 to platforms", () => {
    const reservations = Array.from({ length: 15 }, (_, i) =>
      createMockReservation({ name: `User${i}`, last_name: `Last${i}` }),
    );
    const { container } = render(<PlatformsMap reservations={reservations} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/User0/)).toBeInTheDocument();
  });

  it("assigns platforms by fecha_creacion ascending (oldest → platform 1, ignores fila)", () => {
    const reservations = [
      createMockReservation({ name: "Newest", last_name: "Person", fecha_creacion: "2025-12-01", fila: "3" }),
      createMockReservation({ name: "Oldest", last_name: "Person", fecha_creacion: "2025-01-01", fila: "2" }),
      createMockReservation({ name: "Middle", last_name: "Person", fecha_creacion: "2025-06-15", fila: "1" }),
    ];
    render(<PlatformsMap reservations={reservations} />);
    // Oldest (2025-01-01) → platform 1, Middle → 2, Newest → 3 (fila is ignored)
    expect(screen.getByText(/Oldest/)).toBeInTheDocument();
    expect(screen.getByText(/Middle/)).toBeInTheDocument();
    expect(screen.getByText(/Newest/)).toBeInTheDocument();
    expect(screen.getByText("01").parentElement?.parentElement?.textContent).toContain("Oldest");
  });

  it("assigns platforms by fecha_creacion with DD/MM HH:mm:ss format (API format)", () => {
    const reservations = [
      createMockReservation({ name: "Paty", last_name: "Aquino", fecha_creacion: "12/02 01:39:05", fila: "1" }),
      createMockReservation({ name: "Roxana", last_name: "Cuadra", fecha_creacion: "13/02 15:28:08", fila: "5" }),
      createMockReservation({ name: "Mariam", last_name: "Heded de Alba", fecha_creacion: "10/02 06:04:29", fila: "2" }),
      createMockReservation({ name: "Vinicio", last_name: "Estrada", fecha_creacion: "13/02 13:08:36", fila: "3" }),
    ];
    render(<PlatformsMap reservations={reservations} />);
    // Order by fecha_creacion: Mariam (10/02) → 1, Paty (12/02) → 2, Vinicio (13/02 13:08) → 3, Roxana (13/02 15:28) → 4
    expect(screen.getByText("01").parentElement?.parentElement?.textContent).toContain("Mariam");
    expect(screen.getByText("02").parentElement?.parentElement?.textContent).toContain("Paty");
    expect(screen.getByText("03").parentElement?.parentElement?.textContent).toContain("Vinicio");
    expect(screen.getByText("04").parentElement?.parentElement?.textContent).toContain("Roxana");
  });

  it("assigns platforms by fecha_creacion when fila is undefined or missing", () => {
    const reservations = [
      createMockReservation({ name: "First", last_name: "A", fecha_creacion: "01/02 08:00:00" }),
      createMockReservation({ name: "Second", last_name: "B", fecha_creacion: "02/02 09:00:00", fila: undefined }),
    ];
    render(<PlatformsMap reservations={reservations} />);
    expect(screen.getByText("01").parentElement?.parentElement?.textContent).toContain("First");
    expect(screen.getByText("02").parentElement?.parentElement?.textContent).toContain("Second");
  });

  it("ignores fila property — platform assignment is solely by fecha_creacion", () => {
    // fila says Paty=1, Mariam=2 but fecha_creacion says Mariam is older → Mariam gets platform 1
    const reservations = [
      createMockReservation({ name: "Paty", last_name: "A", fecha_creacion: "12/02 01:39:05", fila: "1" }),
      createMockReservation({ name: "Mariam", last_name: "B", fecha_creacion: "10/02 06:04:29", fila: "2" }),
    ];
    render(<PlatformsMap reservations={reservations} />);
    expect(screen.getByText("01").parentElement?.parentElement?.textContent).toContain("Mariam");
    expect(screen.getByText("02").parentElement?.parentElement?.textContent).toContain("Paty");
  });

  it("renders with size large", () => {
    const { container } = render(<PlatformsMap reservations={[]} size="large" />);
    expect(container).toBeInTheDocument();
  });

  it("renders with size default", () => {
    const { container } = render(<PlatformsMap reservations={[]} size="default" />);
    expect(container).toBeInTheDocument();
  });
});
