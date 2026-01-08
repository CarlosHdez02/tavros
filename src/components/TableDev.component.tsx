import React from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";

// Types
interface Reservation {
  id: number;
  reserva_id: number;
  hash_reserva_id: string;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
  telefono: string;
  status: string;
  nombre_plan: string;
  canal: string;
  fecha_creacion: string;
  asistencia_confirmada?: number;
  pago_pendiente: boolean;
  form_asistencia_url: boolean;
  mostrar_formulario: boolean;
  rating: string | null;
  imagen: string;
}

interface ProcessedSession {
  id: string;
  time: string;
  date: string;
  sessionType: string;
  className: string;
  capacity: number;
  reservations: Reservation[];
  reservationsCount: number;
  color: string;
}

const TableDev = () => {
  const sessionData: ProcessedSession = {
    id: "mock-session-id",
    time: "19:00 - 20:00",
    date: "Lunes, 24 de noviembre",
    sessionType: "Group",
    className: "Sesión de Muestra",
    capacity: 20,
    reservations: [
      {
        id: 1,
        reserva_id: 101,
        hash_reserva_id: "hash1",
        name: "Maria",
        last_name: "Gonzalez",
        full_name: "Maria Gonzalez",
        email: "maria@example.com",
        telefono: "1234567890",
        status: "confirmed",
        nombre_plan: "Plan Mensual Grupal",
        canal: "web",
        fecha_creacion: "2025-11-24",
        asistencia_confirmada: 1,
        pago_pendiente: false,
        form_asistencia_url: false,
        mostrar_formulario: false,
        rating: null,
        imagen: "",
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
        status: "confirmed",
        nombre_plan: "Entrenamiento Personalizado Privado",
        canal: "app",
        fecha_creacion: "2025-11-24",
        asistencia_confirmada: 1,
        pago_pendiente: false,
        form_asistencia_url: false,
        mostrar_formulario: false,
        rating: null,
        imagen: "",
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
        status: "confirmed",
        nombre_plan: "Paquete Semiprivada 10 Sesiones",
        canal: "web",
        fecha_creacion: "2025-11-24",
        asistencia_confirmada: 0,
        pago_pendiente: false,
        form_asistencia_url: false,
        mostrar_formulario: false,
        rating: null,
        imagen: "",
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
        status: "confirmed",
        nombre_plan: "Plan Estándar (Grupal)",
        canal: "web",
        fecha_creacion: "2025-11-24",
        asistencia_confirmada: 1,
        pago_pendiente: false,
        form_asistencia_url: false,
        mostrar_formulario: false,
        rating: null,
        imagen: "",
      },
    ],
    reservationsCount: 4,
    color: "#10b981",
  };

  const columnHelper = createColumnHelper<Reservation>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Cliente",
      cell: (info) => (
        <div
          className="font-bold"
          style={{
            fontSize: "64px",
            color: "#F5F5F5",
            fontWeight: "600",
          }}
        >
          {info.row.original.name} {info.row.original.last_name}
        </div>
      ),
    }),
    columnHelper.accessor("nombre_plan", {
      header: "Tipo de Sesión",
      cell: (info) => {
        const rawValue = info.getValue() || "";
        const lowerValue = rawValue.toLowerCase();
        let displayValue = rawValue || "N/A";

        if (lowerValue.includes("grupal")) {
          displayValue = "Grupal";
        } else if (lowerValue.includes("semiprivada")) {
          displayValue = "Semiprivada";
        } else if (
          lowerValue.includes("privada") ||
          lowerValue.includes("privado")
        ) {
          displayValue = "Privada";
        }

        return (
          <div
            className="font-bold"
            style={{
              fontSize: "40px",
              color: "#F5F5F5",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {displayValue}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data: sessionData.reservations,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        padding: "32px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "4px solid #E8B44F",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              color: "#E8B44F",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Sesiones
          </h1>
          <img
            src={typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src}
            alt="Tavros Logo"
            style={{
              height: "120px",
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
            marginTop: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "64px", // Increased size
                color: "#F5F5F5", // Brighter color
                fontWeight: "800", // Bold
                lineHeight: "1",
                marginBottom: "8px",
              }}
            >
              {sessionData.time}
            </div>
            <div
              style={{
                fontSize: "24px", // Smaller size
                color: "#888888", // Dimmer color
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {sessionData.date}
            </div>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#B8B8B8",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            {sessionData.reservationsCount}/{sessionData.capacity} reservas
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          border: "2px solid #E8B44F",
          overflow: "hidden",
        }}
      >
        {sessionData.reservations.length === 0 ? (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              fontSize: "24px",
              color: "#B8B8B8",
              fontStyle: "italic",
            }}
          >
            Sin reservas
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{
                    borderBottom: "4px solid #E8B44F",
                    backgroundColor: "#1a1a1a",
                  }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        padding: "32px 24px",
                        textAlign:
                          header.id === "asistencia_confirmada" ||
                          header.id === "nombre_plan"
                            ? "center"
                            : "left",
                        fontSize: "28px",
                        fontWeight: "900",
                        color: "#E8B44F",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom:
                      index < table.getRowModel().rows.length - 1
                        ? "2px solid #3a3a3a"
                        : "none",
                    backgroundColor: "#2a2a2a",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: "24px",
                        color: "#F5F5F5",
                        verticalAlign: "middle",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TableDev;
