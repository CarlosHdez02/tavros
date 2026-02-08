import React from "react";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";
import type { Reservation } from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

// Mock data for /dev preview - 5 clients (platforms 1-5 with power rack), 5 empty (platforms 6-10 with Disponible)
const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    reserva_id: 101,
    hash_reserva_id: "hash1",
    name: "Maria",
    last_name: "Gonzalez",
    full_name: "Maria Gonzalez",
    email: "maria@example.com",
    telefono: "1234567890",
    status: "activo",
    nombre_plan: "Grupal (Paquete Full)",
    canal: "web",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 1,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: false,
    rating: null,
    imagen: "default1.jpg",
    fila: "1",
  },
  {
    id: 2,
    reserva_id: 102,
    hash_reserva_id: "hash2",
    name: "Juan",
    last_name: "Perez",
    full_name: "Juan Perez",
    email: "juan@example.com",
    telefono: "0987654321",
    status: "activo",
    nombre_plan: "Paquete de sesiones Privadas",
    canal: "app",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 1,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: false,
    rating: null,
    imagen: "default2.jpg",
    fila: "2",
  },
  {
    id: 3,
    reserva_id: 103,
    hash_reserva_id: "hash3",
    name: "Ana",
    last_name: "Martinez",
    full_name: "Ana Martinez",
    email: "ana@example.com",
    telefono: "1122334455",
    status: "activo",
    nombre_plan: "Paquete de sesiones Semiprivadas",
    canal: "web",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: false,
    rating: null,
    imagen: "default3.jpg",
    fila: "3",
  },
  {
    id: 4,
    reserva_id: 104,
    hash_reserva_id: "hash4",
    name: "Carlos",
    last_name: "Lopez",
    full_name: "Carlos Lopez",
    email: "carlos@example.com",
    telefono: "5566778899",
    status: "activo",
    nombre_plan: "Paquete Trimestral",
    canal: "web",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 1,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: false,
    rating: null,
    imagen: "default4.jpg",
    fila: "4",
  },
  {
    id: 5,
    reserva_id: 105,
    hash_reserva_id: "hash5",
    name: "Francisco",
    last_name: "Fernandez Jimenez",
    full_name: "Francisco Fernandez Jimenez",
    email: "fran@example.com",
    telefono: "3322114455",
    status: "activo",
    nombre_plan: "Plan trimestral en sesiones grupales + inscripción",
    canal: "members",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default5.jpg",
    fila: "5",
  },
  {
    id: 6,
    reserva_id: 106,
    hash_reserva_id: "hash6",
    name: "Valeria",
    last_name: "Ojeda",
    full_name: "Valeria Ojeda",
    email: "valeria@example.com",
    telefono: "3344556677",
    status: "activo",
    nombre_plan: "Grupal (2 sesiones/semanales)",
    canal: "members",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default6.jpg",
    fila: "6",
  },
  {
    id: 7,
    reserva_id: 107,
    hash_reserva_id: "hash7",
    name: "Roberto",
    last_name: "Jurado",
    full_name: "Roberto Jurado",
    email: "roberto@example.com",
    telefono: "3311471361",
    status: "activo",
    nombre_plan: "Grupal (Paquete Full)",
    canal: "members",
    fecha_creacion: "2025-11-24",
    asistencia_confirmada: 0,
    pago_pendiente: false,
    form_asistencia_url: false,
    mostrar_formulario: true,
    rating: null,
    imagen: "default7.jpg",
    fila: "7",
  },
].slice(0, 5); // Use first 5 to show mix: platforms 1-5 = power rack + client, 6-10 = Disponible

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
            Sesión grupal 6:00 am
          </h1>
          <img
            src={typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src}
            alt="Tavros Logo"
            style={{
              height: "clamp(80px, 12vw, 160px)",
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
            Lunes, 6 de febrero — 06:00 a 07:00
          </div>
          <div
            style={{
              fontSize: "clamp(18px, 2.5vw, 28px)",
              color: "#B8B8B8",
              fontWeight: "600",
            }}
          >
            {MOCK_RESERVATIONS.length}/10 en uso
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
        <PlatformsMap reservations={MOCK_RESERVATIONS} size="large" />
      </div>
    </div>
  );
};

export default TableDev;
