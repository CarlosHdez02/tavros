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
  CheckinData,
  ProcessedSession,
  PLAN_MAPPING,
} from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

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
        try {
          const errorJson = await response.json();
          if (errorJson.error === "No data available") {
            console.log("No data available for this date, showing empty table");
            setCheckinData(null);
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

    const dataRefreshInterval = setInterval(
      () => {
        fetchCheckinData();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(dataRefreshInterval);
  }, []);

  // Keep server awake
  useEffect(() => {
    const keepAlive = setInterval(
      async () => {
        try {
          await fetch(`${API_BASE_URL}/health`);
        } catch (e) {
          console.log("Keep-alive ping failed");
        }
      },
      10 * 60 * 1000,
    );

    return () => clearInterval(keepAlive);
  }, []);

  // Process session data - supports both old (time in key) and new (classId key, class in object) API formats
  const sessionData: ProcessedSession | null = useMemo(() => {
    if (!checkinData?.data?.classes) return null;

    const classes = checkinData.data.classes;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const classEntries = Object.entries(classes);

    const isTimeInRange = (
      sh: number,
      sm: number,
      eh: number,
      em: number,
    ) => {
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return currentTotalMinutes >= start && currentTotalMinutes < end;
    };

    // Old format: key contains "HH:MM a HH:MM"
    let currentClassEntry = classEntries.find(([key]) => {
      const m = key.match(/(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/);
      if (m) {
        return isTimeInRange(
          parseInt(m[1], 10),
          parseInt(m[2], 10),
          parseInt(m[3], 10),
          parseInt(m[4], 10),
        );
      }
      return false;
    });

    // New format: time in classData.class (e.g. "Sesión grupal 6:00 am")
    if (!currentClassEntry) {
      currentClassEntry = classEntries.find(([, data]) => {
        const cn = data?.class ?? "";
        const am = cn.match(/(\d{1,2}):(\d{2})\s*am/i);
        const pm = cn.match(/(\d{1,2}):(\d{2})\s*pm/i);
        if (am) {
          const h = parseInt(am[1], 10);
          const m = parseInt(am[2], 10);
          return isTimeInRange(h, m, h + 1, m);
        }
        if (pm) {
          const h = 12 + parseInt(pm[1], 10);
          const m = parseInt(pm[2], 10);
          return isTimeInRange(h, m, h + 1, m);
        }
        return false;
      });
    }

    // Fallback: when API returns a single class, assume it's the current one
    if (!currentClassEntry && classEntries.length === 1) {
      currentClassEntry = classEntries[0];
    }

    if (!currentClassEntry) return null;

    const [, classData] = currentClassEntry;

    // Time display: from key (old format) or class property (new format)
    const keyTime = currentClassEntry[0].match(/(\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2})/);
    const timeDisplay = keyTime
      ? keyTime[1]
      : (classData?.class ?? "Sesión activa");

    const reservations = classData?.reservations ?? [];
    const reservationsCount =
      classData?.totalReservations ?? reservations.length;

    return {
      id: classData?.classId ?? "unknown",
      time: timeDisplay,
      date: new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now),
      sessionType: "Group",
      className: classData?.class ?? "Clase",
      capacity: classData?.limite ?? 0,
      reservations,
      reservationsCount,
      color: "#10b981",
    };
  }, [checkinData]);

  // Truncate name helper with proper handling
  const truncateName = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const first = firstName ?? "";
    const last = lastName ?? "";
    const fullName = `${first} ${last}`.trim();
    const maxLength = 28; // Adjust based on your needs

    if (fullName.length <= maxLength) {
      return fullName;
    }

    // Try to truncate last name first
    if (first.length + 3 < maxLength) {
      const lastNameMaxLength = maxLength - first.length - 1;
      return `${first} ${last.substring(0, lastNameMaxLength)}...`;
    }

    // If first name is too long, truncate the whole thing
    return `${fullName.substring(0, maxLength - 3)}...`;
  };

  const columnHelper = createColumnHelper<Reservation>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Cliente",
      cell: (info) => (
        <div
          className="font-bold"
          style={{
            fontSize: "clamp(20px, 3vw, 34px)",
            color: "#F5F5F5",
            fontWeight: "600",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {truncateName(info.row.original.name, info.row.original.last_name)}
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
              fontSize: "clamp(20px, 3vw, 34px)",
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
    columnHelper.accessor("fila",{
      header: "Fila",
      cell: (info) => {
        return (
          <div
            className="font-bold"
            style={{
              fontSize: "clamp(20px, 3vw, 34px)",
              color: "#F5F5F5",
              fontWeight: "600",
              textAlign: "center",
            }}
          > 
            {info.row.original.fila ?? "Sin plataforma reservada"}
          </div>
        );
      },
    })
  ];

  const now = new Date();

  const startTime = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
  });

  const endDate = new Date(now);
  endDate.setHours(endDate.getHours() + 1);

  const endTime = endDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
  });

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
    data: displayData.reservations ?? [],
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
          padding: "clamp(24px, 5vw, 48px)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
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
      {/* Header - Fixed height */}
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
            marginBottom: "clamp(8px, 1.5vw, 16px)",
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
            Sesiones
          </h1>
          <img
            src={typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src}
            alt="Tavros Logo"
            style={{
              height: "clamp(120px, 18vw, 240px)",
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
            marginTop: "clamp(4px, 1vw, 8px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "clamp(40px, 6vw, 64px)",
                color: "#F5F5F5",
                fontWeight: "800",
                lineHeight: "1",
                marginBottom: "clamp(4px, 1vw, 8px)",
              }}
            >
              {displayData.time}
            </div>
            <div
              style={{
                fontSize: "clamp(16px, 2.2vw, 24px)",
                color: "#888888",
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {displayData.date}
            </div>
          </div>

          <div
            style={{
              fontSize: "clamp(18px, 2.5vw, 28px)",
              color: "#B8B8B8",
              fontWeight: "600",
              marginBottom: "clamp(4px, 1vw, 8px)",
            }}
          >
            {displayData.reservationsCount}/{displayData.capacity} reservas
          </div>
        </div>
      </div>

      {/* Table and Platforms - flexible layout for vertical TV */}
      <div
        style={{
          flex: 1,
          marginTop: "clamp(16px, 2.5vw, 32px)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
      {/* Table Container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: "#2a2a2a",
          borderRadius: "clamp(12px, 2vw, 24px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          border: "2px solid #E8B44F",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}
        >
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
                      padding: "clamp(12px, 2vw, 24px) clamp(12px, 2vw, 24px)",
                      textAlign:
                        header.id === "asistencia_confirmada" ||
                        header.id === "nombre_plan"
                          ? "center"
                          : "left",
                      fontSize: "clamp(18px, 2.5vw, 26px)",
                      fontWeight: "900",
                      color: "#E8B44F",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
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
                    padding: "clamp(32px, 6vw, 64px)",
                    textAlign: "center",
                    fontSize: "clamp(18px, 2.5vw, 24px)",
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
                    height: `${100 / table.getRowModel().rows.length}%`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding:
                          "clamp(8px, 1.5vw, 18px) clamp(12px, 2vw, 24px)",
                        color: "#F5F5F5",
                        verticalAlign: "middle",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Platforms Map - below table */}
      <PlatformsMap reservations={displayData.reservations ?? []} />
      </div>

      {/* Add spinning animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TVScheduleDisplay;
