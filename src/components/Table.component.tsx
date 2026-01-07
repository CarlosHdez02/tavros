"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";
import {
  Reservation,
  //ClassData,
  CheckinData,
  ProcessedSession,
  PLAN_MAPPING,
} from "@/types/Table.type";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tavros-scraper-1.onrender.com";

const TVScheduleDisplay = () => {
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get current date in DD-MM-YYYY format
  const getCurrentDateString = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fetch data from API
  const fetchCheckinData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = getCurrentDateString();
      const response = await fetch(`${API_BASE_URL}/api/checkin/${dateStr}`);

      if (!response.ok) {
        // Check if it's the specific "No data available" error
        try {
          const errorJson = await response.json();
          if (errorJson.error === "No data available") {
            console.log("No data available for this date, showing empty table");
            setCheckinData(null); // This will trigger the empty state fallback
            return;
          }
        } catch (e) {
          // Ignore JSON parse error on error response
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CheckinData = await response.json();
      setCheckinData(data);
    } catch (err) {
      console.error("Error fetching check-in data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    fetchCheckinData();

    const dataRefreshInterval = setInterval(() => {
      fetchCheckinData();
    }, 5 * 60 * 1000);

    return () => clearInterval(dataRefreshInterval);
  }, []);

  // Keep server awake
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/health`);
      } catch (e) {
        console.log("Keep-alive ping failed");
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);

  // Process session data
  const sessionData: ProcessedSession | null = useMemo(() => {
    if (!checkinData?.data?.classes) return null;

    const classes = checkinData.data.classes;
    const now = new Date();
    const currentHour = now.getHours();

    // Find the class that matches the current hour
    // Class keys are like "Sesión grupal 7:00 pm - 19:00 a 20:00 - Presencial"
    const classEntries = Object.entries(classes);

    const currentClassEntry = classEntries.find(([key, _]) => {
      // Extract time range from key, e.g., "19:00 a 20:00"
      const timeMatch = key.match(/(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const startHour = parseInt(timeMatch[1]);
        // const startMinute = parseInt(timeMatch[2]);
        const endHour = parseInt(timeMatch[3]);
        // const endMinute = parseInt(timeMatch[4]);

        // Check if current hour is within the range (inclusive start, exclusive end)
        return currentHour >= startHour && currentHour < endHour;
      }
      return false;
    });

    // If no class found for current time, maybe show the next upcoming class?
    // For now, let's stick to the request: "show the class attendees that are in that specific time interval"
    // If no class, we return null (which shows "No hay datos disponibles")

    if (!currentClassEntry) return null;

    const [classNameKey, classData] = currentClassEntry;

    // Extract clean time string for display
    const timeDisplayMatch = classNameKey.match(
      /(\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2})/
    );
    const timeDisplay = timeDisplayMatch
      ? timeDisplayMatch[1]
      : "Hora desconocida";

    return {
      id: classData.classId,
      time: timeDisplay,
      date: new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now),
      sessionType: "Group",
      className: classNameKey.split("-")[0].trim(),
      capacity: classData.limite,
      reservations: classData.reservations,
      reservationsCount: classData.totalReservations,
      color: "#10b981",
    };
  }, [checkinData]);

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
        let displayValue = PLAN_MAPPING[rawValue];

        if (!displayValue) {
          const lowerValue = rawValue.toLowerCase();

          if (lowerValue.includes("grupal")) {
            displayValue = "Grupal";
          } else if (lowerValue.includes("semiprivada")) {
            displayValue = "Semiprivada";
          } else if (
            lowerValue.includes("privada") ||
            lowerValue.includes("privado")
          ) {
            displayValue = "Privada";
          } else {
            displayValue = rawValue || "N/A";
          }
        }

        return (
          <div
            className="font-bold"
            style={{
              fontSize: "64px",
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

  const now = new Date();

  // Start time (current time, rounded to minutes)
  const startTime = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
  });

  // End time (+1 hour)
  const endDate = new Date(now);
  endDate.setHours(endDate.getHours() + 1);

  const endTime = endDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
  });

  // Ensure we always have a sessionData object to render, even if empty
  const displayData = sessionData || {
    id: "empty",
    time: `${startTime}:00 - ${endTime}:00`,
    date: new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    sessionType: "Sin sesión",
    className: "Sin sesión activa",
    capacity: 0,
    reservations: [],
    reservationsCount: 0,
    color: "#374151",
  };

  const table = useReactTable({
    columns,
    data: displayData.reservations,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading && !checkinData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          padding: "48px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "42px",
              color: "#E8B44F",
              marginBottom: "32px",
              fontWeight: "700",
            }}
          >
            Cargando datos...
          </div>
          <div
            style={{
              width: "80px",
              height: "80px",
              border: "8px solid #3a3a3a",
              borderTop: "8px solid #E8B44F",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
        </div>
      </div>
    );
  }

  // Removed error and no-data early returns to show the table structure always

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
              height: "240px",
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
              {displayData.time}
            </div>
            <div
              style={{
                fontSize: "24px", // Smaller size
                color: "#888888", // Dimmer color
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {displayData.date}
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
            {displayData.reservationsCount}/{displayData.capacity} reservas
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "64px",
                    textAlign: "center",
                    fontSize: "24px",
                    color: "#B8B8B8",
                    fontStyle: "italic",
                  }}
                >
                  Sin reservas
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TVScheduleDisplay;
