"use client";
import React, { useState, useEffect, useMemo } from "react";
import tavrosLogo from "../../public/tavros-logo.png";
import { CheckinData, ProcessedSession } from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tavros-scraper-1.onrender.com";

const TVScheduleDisplay = () => {
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  /** Must be in sessionData useMemo deps — time-based "active class" logic uses `new Date()` inside the memo. */
  const [sessionTick, setSessionTick] = useState(0);

  // Re-run session matching on an interval so when the current class ends, we show
  // "Sin sesión activa" + empty platforms without waiting for the 5m API refetch.
  useEffect(() => {
    const t = setInterval(() => setSessionTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

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
            setCheckinData(null);
            setLoading(false);
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
  // Wrapped in try-catch to prevent crash/white screen on parse errors
  const sessionData: ProcessedSession | null = useMemo(() => {
    try {
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
      let end = eh * 60 + em;
      // e.g. "11:00 a 00:00" — end on/after midnight
      if (end <= start) end += 24 * 60;
      return currentTotalMinutes >= start && currentTotalMinutes < end;
    };

    // Old format: key contains "HH:MM a HH:MM"
    const oldFormatEntry = classEntries.find(([key]) => {
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

    // New format: time in classData.class (e.g. "Sesión grupal 6:00 am", "Sesión grupal 12:00 pm").
    // Several classes can run in the same hour (e.g. grupal + semiprivada at 7:00 am) and all of
    // those clients are physically on the platforms, so collect every match instead of only the first.
    const matchingEntries = oldFormatEntry
      ? [oldFormatEntry]
      : classEntries.filter(([, data]) => {
          // 1) Raw 24h fields from the API, 2) "HH:MM a HH:MM" in the label, 3) "H:MM am/pm" in the name
          const hm = (v?: string) => v?.match(/^(\d{1,2}):(\d{2})/);
          const start = hm(data?.hora_inicio);
          const end = hm(data?.hora_fin);
          if (start && end) {
            return isTimeInRange(+start[1], +start[2], +end[1], +end[2]);
          }
          const range = (data?.class ?? "").match(/(\d{1,2}):(\d{2})\s+a\s+(\d{1,2}):(\d{2})/);
          if (range) {
            return isTimeInRange(+range[1], +range[2], +range[3], +range[4]);
          }
          const t = (data?.class ?? "").match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\b/i);
          if (!t) return false;
          const h12 = parseInt(t[1], 10);
          const m = parseInt(t[2], 10);
          const isPm = t[3].toLowerCase() === "p";
          // 12:xx am → 0, 12:xx pm → 12 (previously 12 pm became 24 and never matched)
          const h = (h12 % 12) + (isPm ? 12 : 0);
          return isTimeInRange(h, m, h + 1, m);
        });

    // No fallback: if no class matches current time, show "Sin sesión activa"
    // (prevents showing wrong class when last class ended at hour boundary)
    if (matchingEntries.length === 0) return null;

    // Class with the most reservations first so it drives the header / platform order
    const reservationCountOf = (c: (typeof matchingEntries)[number][1]) =>
      c?.totalReservations ?? c?.reservations?.length ?? 0;
    const sortedEntries = [...matchingEntries].sort(
      ([, a], [, b]) => reservationCountOf(b) - reservationCountOf(a),
    );
    const [primaryKey, classData] = sortedEntries[0];

    // Time display: from key (old format) or class property (new format)
    const keyTime = primaryKey.match(/(\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2})/);
    const timeDisplay = keyTime
      ? keyTime[1]
      : (classData?.class ?? "Sesión activa");

    const seen = new Set<string | number>();
    const reservations = sortedEntries
      .flatMap(([, c]) => (Array.isArray(c?.reservations) ? c.reservations : []))
      .filter((r) => {
        const key = r?.reserva_id ?? r?.id;
        if (key == null) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const reservationsCount = sortedEntries.reduce(
      (sum, [, c]) => sum + reservationCountOf(c),
      0,
    );

      return {
        id: sortedEntries.map(([, c]) => c?.classId ?? "unknown").join("+"),
        time: timeDisplay,
        date: new Intl.DateTimeFormat("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(now),
        sessionType: "Group",
        className: sortedEntries.map(([, c]) => c?.class ?? "Clase").join(" + "),
        capacity: sortedEntries.reduce((sum, [, c]) => sum + (c?.limite ?? 0), 0),
        reservations,
        reservationsCount,
        color: "#10b981",
      };
    } catch {
      return null;
    }
  }, [checkinData, sessionTick]);

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
      data-testid="tv-schedule-root"
      style={{
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        padding: "clamp(16px, 2.5vw, 32px)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
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
            minWidth: 0,
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
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {displayData.className}
          </h1>
          <img
            src={typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src}
            alt="Tavros Logo"
            style={{
              // Height-based so the platforms map keeps enough room on 1080p TVs
              height: "clamp(80px, 15vh, 180px)",
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

      {/* Platforms Map - full layout driven by API data */}
      <div
        style={{
          flex: 1,
          marginTop: "clamp(16px, 2.5vw, 32px)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PlatformsMap
          reservations={displayData.reservations ?? []}
          sessionTime={displayData.time}
          size="large"
        />
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
