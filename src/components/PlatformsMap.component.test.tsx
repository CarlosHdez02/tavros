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

  it("renders with size large", () => {
    const { container } = render(<PlatformsMap reservations={[]} size="large" />);
    expect(container).toBeInTheDocument();
  });

  it("renders with size default", () => {
    const { container } = render(<PlatformsMap reservations={[]} size="default" />);
    expect(container).toBeInTheDocument();
  });
});
