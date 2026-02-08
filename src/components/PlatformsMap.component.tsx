"use client";

import React from "react";
import type { Reservation } from "@/types/Table.type";
import { PLAN_MAPPING } from "@/types/Table.type";

const TOTAL_PLATFORMS = 10;

/** 45° diagonal hatching pattern for active platforms - croquis/blueprint style */
const HatchPattern = ({ id }: { id: string }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <defs>
      <pattern
        id={id}
        width="12"
        height="12"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45 6 6)"
      >
        <line x1="0" y1="0" x2="0" y2="12" stroke="#000" strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

/** Dumbbell rack sketch - croquis style */
const DumbbellRackSketch = () => (
  <svg width="100%" height="100%" viewBox="0 0 80 100" preserveAspectRatio="xMidYMid meet">
    {/* Vertical posts */}
    <line x1="15" y1="15" x2="15" y2="85" stroke="#000" strokeWidth="1.5" />
    <line x1="65" y1="15" x2="65" y2="85" stroke="#000" strokeWidth="1.5" />
    {/* Horizontal bars */}
    <line x1="12" y1="25" x2="68" y2="25" stroke="#000" strokeWidth="1.2" />
    <line x1="12" y1="50" x2="68" y2="50" stroke="#000" strokeWidth="1.2" />
    <line x1="12" y1="75" x2="68" y2="75" stroke="#000" strokeWidth="1.2" />
    {/* Dumbbells - circles for weights */}
    <circle cx="25" cy="25" r="6" fill="none" stroke="#000" strokeWidth="1" />
    <circle cx="55" cy="25" r="6" fill="none" stroke="#000" strokeWidth="1" />
    <circle cx="25" cy="50" r="6" fill="none" stroke="#000" strokeWidth="1" />
    <circle cx="55" cy="50" r="6" fill="none" stroke="#000" strokeWidth="1" />
    <circle cx="25" cy="75" r="6" fill="none" stroke="#000" strokeWidth="1" />
    <circle cx="55" cy="75" r="6" fill="none" stroke="#000" strokeWidth="1" />
  </svg>
);

/** Power rack sketch - matches reference: uprights, bases, barbell rests, safety spotters */
const PowerRackSketch = () => (
  <svg width="100%" height="100%" viewBox="0 0 60 90" preserveAspectRatio="xMidYMid meet">
    {/* Base plates */}
    <rect x="5" y="75" width="18" height="10" fill="none" stroke="#000" strokeWidth="1.2" />
    <rect x="37" y="75" width="18" height="10" fill="none" stroke="#000" strokeWidth="1.2" />
    {/* Vertical uprights */}
    <line x1="14" y1="8" x2="14" y2="75" stroke="#000" strokeWidth="1.5" />
    <line x1="46" y1="8" x2="46" y2="75" stroke="#000" strokeWidth="1.5" />
    {/* Top crossbar */}
    <line x1="12" y1="8" x2="48" y2="8" stroke="#000" strokeWidth="1.5" />
    {/* Barbell rests (J-hooks) on top - cylindrical */}
    <line x1="6" y1="12" x2="6" y2="18" stroke="#000" strokeWidth="1.2" />
    <line x1="54" y1="12" x2="54" y2="18" stroke="#000" strokeWidth="1.2" />
    <line x1="4" y1="15" x2="56" y2="15" stroke="#000" strokeWidth="1" />
    {/* Lower crossbar / safety level */}
    <line x1="12" y1="48" x2="48" y2="48" stroke="#000" strokeWidth="1.2" />
    {/* Safety spotters (rectangular) */}
    <rect x="8" y="50" width="10" height="6" fill="none" stroke="#000" strokeWidth="1" />
    <rect x="42" y="50" width="10" height="6" fill="none" stroke="#000" strokeWidth="1" />
    {/* Adjustment holes on left upright */}
    {[22, 30, 38, 46, 54, 62].map((y) => (
      <line key={y} x1="12" y1={y} x2="16" y2={y} stroke="#000" strokeWidth="0.8" />
    ))}
  </svg>
);

/** Lat pulldown machine sketch - croquis style */
const LatPulldownSketch = () => (
  <svg width="100%" height="100%" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
    {/* Tower / upright frame */}
    <line x1="15" y1="5" x2="15" y2="75" stroke="#000" strokeWidth="1.5" />
    <line x1="45" y1="5" x2="45" y2="75" stroke="#000" strokeWidth="1.5" />
    <line x1="12" y1="8" x2="48" y2="8" stroke="#000" strokeWidth="1.2" />
    {/* Cable / pulley area */}
    <line x1="30" y1="8" x2="30" y2="55" stroke="#000" strokeWidth="1" strokeDasharray="2 2" />
    {/* Bar */}
    <line x1="15" y1="55" x2="45" y2="55" stroke="#000" strokeWidth="1.5" />
    {/* Seat */}
    <rect x="20" y="65" width="20" height="8" fill="none" stroke="#000" strokeWidth="1" />
  </svg>
);

/** Entrance cell - door with arc, lower-left corner */
const EntranceCell = () => (
  <div
    style={{
      gridColumn: "1",
      gridRow: "3",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(12px, 2vw, 24px)",
      borderRight: "2px solid #000",
      borderTop: "2px solid #000",
      backgroundColor: "#fff",
    }}
  >
    <svg
      width="90%"
      height="clamp(70px, 14vh, 140px)"
      viewBox="0 0 60 70"
      preserveAspectRatio="xMidYMax meet"
      style={{ flexShrink: 0 }}
    >
      <path d="M 10 70 A 45 45 0 0 1 55 25" fill="none" stroke="#000" strokeWidth="2.5" />
      <line x1="10" y1="70" x2="55" y2="25" stroke="#000" strokeWidth="1.2" strokeDasharray="3 2" />
    </svg>
    <div
      style={{
        fontSize: "clamp(16px, 2.5vw, 28px)",
        fontWeight: "800",
        color: "#000",
        textTransform: "uppercase",
        letterSpacing: "2px",
        marginTop: "clamp(8px, 1.5vw, 16px)",
      }}
    >
      Entrada
    </div>
  </div>
);

interface PlatformsMapProps {
  reservations: Reservation[];
  /** When true, fills available space with larger platforms (for standalone/full-screen view) */
  size?: "default" | "large";
}

const getSessionTypeDisplay = (nombrePlan: string | null | undefined): string => {
  if (!nombrePlan) return "Sesión";
  const mapped = PLAN_MAPPING[nombrePlan];
  if (mapped) return mapped.toUpperCase();
  const lower = nombrePlan.toLowerCase();
  if (lower.includes("grupal")) return "GRUPAL";
  if (lower.includes("semiprivad")) return "SEMIPRIVADA";
  if (lower.includes("privad")) return "PRIVADA";
  if (lower.includes("open gym")) return "OPEN GYM";
  return nombrePlan.substring(0, 20).toUpperCase();
};

const truncateName = (firstName: string, lastName: string, maxLen = 18): string => {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  if (full.length <= maxLen) return full;
  return `${full.substring(0, maxLen - 3)}...`;
};

const PlatformsMap: React.FC<PlatformsMapProps> = ({ reservations, size = "default" }) => {
  const platformAssignments = React.useMemo(() => {
    const map = new Map<number, Reservation>();
    reservations.slice(0, TOTAL_PLATFORMS).forEach((r, i) => {
      map.set(i + 1, r);
    });
    return map;
  }, [reservations]);

  const isLarge = size === "large";

  // Platform positions in the floor plan: [col, row, colSpan]
  const platformLayout: [number, number, number][] = [
    [2, 1, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1], // 1-4
    [2, 2, 1], [3, 2, 1], [4, 2, 1], [5, 2, 1], // 5-8
    [2, 3, 2], [4, 3, 2], // 9-10 (centered in bottom row)
  ];

  return (
    <div
      style={{
        width: "100%",
        height: isLarge ? "100%" : "auto",
        marginTop: isLarge ? 0 : "clamp(12px, 2vw, 20px)",
        padding: isLarge ? "clamp(16px, 2.5vw, 32px)" : "clamp(8px, 1.5vw, 16px)",
        backgroundColor: "#faf9f6",
        border: "3px solid #000",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Corridor path from entrance - dotted line (architectural convention) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Path from entrance into main platform area */}
        <path
          d="M 5 92 L 12 92 L 12 8"
          fill="none"
          stroke="#000"
          strokeWidth="0.6"
          strokeDasharray="5 4"
          opacity="0.45"
        />
      </svg>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(90px, 16%) 1fr 1fr 1fr 1fr minmax(55px, 8%)",
          gridTemplateRows: isLarge ? "1fr 1fr 1fr" : "auto auto auto",
          gap: 0,
          width: "100%",
          flex: isLarge ? 1 : undefined,
          minHeight: isLarge ? 0 : "clamp(320px, 50vh, 500px)",
          borderTop: "2px solid #000",
          borderRight: "2px solid #000",
        }}
      >
        {/* Corridor above entrance - large window full height (architectural) */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "1 / 3",
            position: "relative",
            borderRight: "2px solid #000",
            borderBottom: "2px solid #000",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
            padding: "clamp(6px, 1vw, 12px)",
          }}
        >
          {/* Window - fills entire cell, frame with mullions */}
          <svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="56" height="96" fill="none" stroke="#000" strokeWidth="2" />
            <line x1="30" y1="2" x2="30" y2="98" stroke="#000" strokeWidth="1.2" />
            <line x1="2" y1="50" x2="58" y2="50" stroke="#000" strokeWidth="1.2" />
          </svg>
        </div>
        <EntranceCell />
        {/* Dumbbell rack + lat pulldown - next to platform 10 (right side) */}
        <div
          style={{
            gridColumn: "6",
            gridRow: "3",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 1.5vw, 16px)",
            padding: "clamp(8px, 1.5vw, 16px)",
            borderLeft: "2px solid #000",
            borderTop: "2px solid #000",
            backgroundColor: "#fff",
            minHeight: isLarge ? "clamp(100px, 14vh, 200px)" : "clamp(90px, 12vw, 140px)",
          }}
        >
          <div style={{ flex: 1, width: "100%", minHeight: "45%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DumbbellRackSketch />
          </div>
          <div style={{ flex: 1, width: "100%", minHeight: "45%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LatPulldownSketch />
          </div>
        </div>
        {Array.from({ length: TOTAL_PLATFORMS }, (_, i) => {
          const platformNum = i + 1;
          const client = platformAssignments.get(platformNum);
          const isActive = !!client;
          const [col, row, colSpan] = platformLayout[i];

          return (
            <div
              key={platformNum}
              style={{
                position: "relative",
                gridColumn: `${col} / span ${colSpan}`,
                gridRow: row,
                minHeight: isLarge ? "clamp(100px, 14vh, 200px)" : "clamp(90px, 12vw, 140px)",
                backgroundColor: "#ffffff",
                border: isActive ? "2px solid #000" : "1px dashed #000",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: isLarge ? "clamp(12px, 2vw, 24px)" : "clamp(8px, 1.5vw, 14px)",
                overflow: "hidden",
              }}
            >
              {isActive && <HatchPattern id={`hatch-platform-${platformNum}`} />}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
              <div
                style={{
                  fontSize: isLarge ? "clamp(18px, 2.5vw, 32px)" : "clamp(11px, 1.8vw, 16px)",
                  fontWeight: "700",
                  color: "#000",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: isLarge ? "clamp(8px, 1.2vw, 16px)" : "clamp(4px, 0.8vw, 8px)",
                  alignSelf: "flex-start",
                }}
              >
                Plataforma {String(platformNum).padStart(2, "0")}
              </div>
              {isActive && client ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      flex: 1,
                      border: "1px solid #000",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isLarge ? "clamp(10px, 1.5vw, 18px)" : "clamp(6px, 1vw, 10px)",
                      minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                      overflow: "hidden",
                      gap: isLarge ? "clamp(6px, 1vw, 12px)" : "clamp(4px, 0.8vw, 8px)",
                    }}
                  >
                    <div style={{ flex: "0 0 auto", width: "45%", minHeight: "clamp(50px, 8vh, 100px)" }}>
                      <PowerRackSketch />
                    </div>
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(22px, 3vw, 36px)" : "clamp(11px, 1.8vw, 18px)",
                        fontWeight: "700",
                        color: "#000",
                        textAlign: "center",
                        width: "100%",
                        lineHeight: 1.2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                        minHeight: "2.4em",
                      }}
                    >
                      {truncateName(client.name, client.last_name, 36)}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: isLarge ? "clamp(8px, 1.2vw, 14px)" : "clamp(4px, 0.8vw, 6px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(16px, 2.2vw, 24px)" : "clamp(9px, 1.4vw, 12px)",
                        fontWeight: "700",
                        color: "#000",
                      }}
                    >
                      En uso
                    </div>
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(12px, 1.6vw, 18px)" : "clamp(7px, 1vw, 10px)",
                        fontWeight: "600",
                        color: "#000",
                      }}
                    >
                      {getSessionTypeDisplay(client.nombre_plan)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      border: "1px dashed #000",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                      gap: "clamp(4px, 0.8vw, 8px)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isLarge ? "clamp(36px, 5vw, 56px)" : "clamp(18px, 3vw, 28px)",
                        color: "#000",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                    <span
                      style={{
                        fontSize: isLarge ? "clamp(18px, 2.5vw, 28px)" : "clamp(10px, 1.5vw, 14px)",
                        fontWeight: "700",
                        color: "#000",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Disponible
                    </span>
                  </div>
                </>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformsMap;
