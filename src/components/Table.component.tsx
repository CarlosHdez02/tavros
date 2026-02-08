"use client";
import React, { useState, useEffect, useMemo } from "react";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";
import { CheckinData, ProcessedSession } from "@/types/Table.type";
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
            {displayData.className}
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

      {/* Platforms Map - full layout driven by API data */}
      <div
        style={{
          flex: 1,
          marginTop: "clamp(16px, 2.5vw, 32px)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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
