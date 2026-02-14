import React from "react";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";
import type { Reservation } from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

// Mock data for /dev — class tomorrow 8am (alumnos API format transformed to Reservation)
// Platforms assigned by fecha_creacion ascending: Mariam (10/02) → 1, Paty (12/02) → 2, Vinicio (13/02 13:08) → 3, Roxana (13/02 15:28) → 4
const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 884513,
    reserva_id: 29355891,
    hash_reserva_id: "x0Jr1xrA0v",
    name: "Mariam",
    last_name: "Heded de Alba",
    full_name: "Mariam Heded de Alba",
    email: "mariam.heded@gmail.com",
    telefono: "33 3956 5866",
    status: "activo",
    nombre_plan: "Paquete Semestral Semiprivadas + Inscripción",
    canal: "members",
    fecha_creacion: "10/02 06:04:29",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default10.jpg",
    fila: "2",
  },
  {
    id: 1024566,
    reserva_id: 29408419,
    hash_reserva_id: "p4QNk9xN0a",
    name: "Paty",
    last_name: "Aquino",
    full_name: "Paty Aquino",
    email: "pherrang@gmail.com",
    telefono: "33 3667 1034",
    status: "activo",
    nombre_plan: "Paquete de sesiones Semiprivadas",
    canal: "members",
    fecha_creacion: "12/02 01:39:05",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default1.jpg",
    fila: "1",
  },
  {
    id: 884552,
    reserva_id: 29438719,
    hash_reserva_id: "p4QNkgnG0a",
    name: "Vinicio",
    last_name: "Estrada",
    full_name: "Vinicio Estrada",
    email: "vinicio.estrada@gmail.com",
    telefono: "33 3100 5555",
    status: "activo",
    nombre_plan: "Paquete de sesiones Semiprivadas",
    canal: "members",
    fecha_creacion: "13/02 13:08:36",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default10.jpg",
    fila: "3",
  },
  {
    id: 941539,
    reserva_id: 29441395,
    hash_reserva_id: "vLX5xd9d4E",
    name: "Roxana",
    last_name: "Cuadra",
    full_name: "Roxana Cuadra",
    email: "roxannacuadra.avida@gmail.com",
    telefono: "673 107 2333",
    status: "activo",
    nombre_plan: "Paquete de sesiones Semiprivadas",
    canal: "members",
    fecha_creacion: "13/02 15:28:08",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default10.jpg",
    fila: "5",
  },
];

const TableDev = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        padding: "clamp(16px, 2.5vw, 32px)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          paddingBottom: "clamp(12px, 2vw, 24px)",
          borderBottom: "4px solid #E8B44F",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 56px)",
              fontWeight: "900",
              color: "#E8B44F",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Sesión semiprivada 8:00 am
          </h1>
          <img
            src={typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src}
            alt="Tavros Logo"
            style={{
              height: "clamp(100px, 16vw, 200px)",
              width: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "clamp(8px, 1.5vw, 16px)",
          }}
        >
          <div
            style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              color: "#888888",
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            Viernes, 7 de febrero — 08:00 a 09:00
          </div>
          <div
            style={{
              fontSize: "clamp(18px, 2.5vw, 28px)",
              color: "#B8B8B8",
              fontWeight: "600",
            }}
          >
            {MOCK_RESERVATIONS.length}/5 reservas
          </div>
        </div>
      </div>

      {/* Platforms Map - fills remaining space */}
      <div
        style={{
          flex: 1,
          marginTop: "clamp(16px, 2.5vw, 32px)",
          minHeight: 0,
        }}
      >
        <PlatformsMap
          reservations={MOCK_RESERVATIONS}
          sessionTime="08:00 - 09:00"
          size="large"
        />
      </div>
    </div>
  );
};

export default TableDev;
