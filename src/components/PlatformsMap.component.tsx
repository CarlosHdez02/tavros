"use client";

import React from "react";
import type { Reservation } from "@/types/Table.type";
import { PLAN_MAPPING } from "@/types/Table.type";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";

const TOTAL_PLATFORMS = 10;
const GOLD = "#E8B44F";
const GREY_LIGHT = "#B8B8B8";
const GREY_MID = "#4a4a4a";
const GREY_BORDER = "#3a3a3a";
const CARD_BG = "#252525";

/** 45° diagonal hatching pattern for active platforms - light on dark */
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
        <line x1="0" y1="0" x2="0" y2="12" stroke={GREY_MID} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

/** Dumbbell rack sketch - yellow stroke */
const DumbbellRackSketch = () => (
  <svg width="100%" height="100%" viewBox="0 0 80 100" preserveAspectRatio="xMidYMid meet">
    <line x1="15" y1="15" x2="15" y2="85" stroke={GOLD} strokeWidth="1.5" />
    <line x1="65" y1="15" x2="65" y2="85" stroke={GOLD} strokeWidth="1.5" />
    <line x1="12" y1="25" x2="68" y2="25" stroke={GOLD} strokeWidth="1.2" />
    <line x1="12" y1="50" x2="68" y2="50" stroke={GOLD} strokeWidth="1.2" />
    <line x1="12" y1="75" x2="68" y2="75" stroke={GOLD} strokeWidth="1.2" />
    <circle cx="25" cy="25" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="55" cy="25" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="25" cy="50" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="55" cy="50" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="25" cy="75" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="55" cy="75" r="6" fill="none" stroke={GOLD} strokeWidth="1" />
  </svg>
);

/** Lat pulldown machine sketch - yellow stroke */
const LatPulldownSketch = () => (
  <svg width="100%" height="100%" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
    <line x1="15" y1="5" x2="15" y2="75" stroke={GOLD} strokeWidth="1.5" />
    <line x1="45" y1="5" x2="45" y2="75" stroke={GOLD} strokeWidth="1.5" />
    <line x1="12" y1="8" x2="48" y2="8" stroke={GOLD} strokeWidth="1.2" />
    <line x1="30" y1="8" x2="30" y2="55" stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" />
    <line x1="15" y1="55" x2="45" y2="55" stroke={GOLD} strokeWidth="1.5" />
    <rect x="20" y="65" width="20" height="8" fill="none" stroke={GOLD} strokeWidth="1" />
  </svg>
);

/** Entrance cell - door with arc, yellow accents (top right) */
const EntranceCell = () => (
  <div
    style={{
      gridColumn: "6",
      gridRow: "1",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(6px, 1vw, 12px)",
      borderLeft: `2px solid ${GOLD}`,
      borderTop: `2px solid ${GOLD}`,
      borderBottom: `2px solid ${GOLD}`,
      backgroundColor: "#1e1c18",
    }}
  >
    <svg
      width="85%"
      height="clamp(50px, 10vh, 90px)"
      viewBox="0 0 60 70"
      preserveAspectRatio="xMidYMax meet"
      style={{ flexShrink: 0 }}
    >
      <path d="M 10 70 A 45 45 0 0 1 55 25" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <line x1="10" y1="70" x2="55" y2="25" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" />
    </svg>
    <div
      style={{
        fontSize: "clamp(10px, 1.4vw, 16px)",
        fontWeight: "800",
        color: GOLD,
        textTransform: "uppercase",
        letterSpacing: "2px",
        marginTop: "clamp(4px, 0.8vw, 8px)",
      }}
    >
      Entrada
    </div>
  </div>
);

interface PlatformsMapProps {
  reservations: Reservation[];
  /** Session time string e.g. "06:00 - 07:00" for class duration display */
  sessionTime?: string;
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

const PlatformsMap: React.FC<PlatformsMapProps> = ({ reservations, sessionTime = "—", size = "default" }) => {
  const platformAssignments = React.useMemo(() => {
    const map = new Map<number, Reservation>();
    reservations.slice(0, TOTAL_PLATFORMS).forEach((r, i) => {
      map.set(i + 1, r);
    });
    return map;
  }, [reservations]);

  const isLarge = size === "large";

  // Platform positions: 9-10 at top, 1-8 below. [col, row, colSpan]
  const platformLayout: [number, number, number][] = [
    [2, 2, 1], [3, 2, 1], [4, 2, 1], [5, 2, 1], // 1-4 (row 2)
    [2, 3, 1], [3, 3, 1], [4, 3, 1], [5, 3, 1], // 5-8 (row 3)
    [2, 1, 2], [4, 1, 2], // 9-10 (row 1, top)
  ];

  return (
    <div
      style={{
        width: "100%",
        height: isLarge ? "100%" : "auto",
        marginTop: isLarge ? 0 : "clamp(12px, 2vw, 20px)",
        padding: isLarge ? "clamp(16px, 2.5vw, 32px)" : "clamp(8px, 1.5vw, 16px)",
        backgroundColor: "#2d2a24",
        border: `3px solid ${GOLD}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(50px, 7%) 1fr 1fr 1fr 1fr minmax(40px, 6%)",
          gridTemplateRows: isLarge ? "1fr 1fr 1fr" : "auto auto auto",
          gap: 0,
          width: "100%",
          flex: isLarge ? 1 : undefined,
          minHeight: isLarge ? 0 : "clamp(320px, 50vh, 500px)",
          borderTop: `2px solid ${GOLD}`,
          borderRight: `2px solid ${GOLD}`,
        }}
      >
        {/* Window - top left (original position) */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "1",
            position: "relative",
            borderRight: `2px solid ${GOLD}`,
            borderBottom: `2px solid ${GOLD}`,
            backgroundColor: "#1e1c18",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
            padding: "clamp(2px, 0.4vw, 5px)",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="56" height="96" fill="#252119" stroke={GOLD} strokeWidth="2" />
            <line x1="30" y1="2" x2="30" y2="98" stroke={GOLD} strokeWidth="1.2" />
            <line x1="2" y1="50" x2="58" y2="50" stroke={GOLD} strokeWidth="1.2" />
          </svg>
        </div>
        {/* Dumbbell rack + lat pulldown - left side, below window */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "2 / 4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(0px, 0.2vw, 2px)",
            padding: "clamp(4px, 0.8vw, 10px)",
            borderRight: `2px solid ${GOLD}`,
            borderTop: `2px solid ${GOLD}`,
            backgroundColor: "#1e1c18",
            minHeight: isLarge ? "clamp(70px, 10vh, 140px)" : "clamp(60px, 8vw, 100px)",
          }}
        >
          <div style={{ flex: 1, width: "100%", minHeight: "45%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DumbbellRackSketch />
          </div>
          <div style={{ flex: 1, width: "100%", minHeight: "45%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LatPulldownSketch />
          </div>
        </div>
        <EntranceCell />
        {Array.from({ length: TOTAL_PLATFORMS }, (_, i) => {
          const platformNum = i + 1;
          const client = platformAssignments.get(platformNum);
          const isActive = !!client;
          const [col, row, colSpan] = platformLayout[i];

          const logoSrc = typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src;
          return (
            <div
              key={platformNum}
              style={{
                position: "relative",
                gridColumn: `${col} / span ${colSpan}`,
                gridRow: row,
                minHeight: isLarge ? "clamp(100px, 14vh, 200px)" : "clamp(90px, 12vw, 140px)",
                backgroundColor: CARD_BG,
                border: isActive ? `2px solid ${GREY_BORDER}` : `1px dashed ${GREY_BORDER}`,
                borderRadius: "clamp(6px, 1vw, 12px)",
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
                  color: GREY_LIGHT,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: isLarge ? "clamp(8px, 1.2vw, 16px)" : "clamp(4px, 0.8vw, 8px)",
                  alignSelf: "flex-start",
                }}
              >
              
                {String(platformNum).padStart(2, "0")}
              </div>
              {isActive && client ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    border: `1px solid ${GREY_BORDER}`,
                    borderRadius: "clamp(4px, 0.6vw, 8px)",
                    backgroundColor: "#1a1814",
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
                  {/* Row 1: Client name (above logo) */}
                  <div
                    style={{
                      fontSize: isLarge ? "clamp(20px, 2.8vw, 32px)" : "clamp(11px, 1.8vw, 18px)",
                      fontWeight: "700",
                      color: GOLD,
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
                  {/* Row 2: Tavros logo at center */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: "clamp(80px, 14vw, 140px)",
                    }}
                  >
                    <img
                      src={logoSrc}
                      alt="Tavros"
                      style={{
                        width: "70%",
                        maxWidth: "clamp(80px, 16vw, 140px)",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  {/* Row 3: Time and class type (below logo) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "clamp(4px, 0.6vw, 8px)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(20px, 3vw, 32px)" : "clamp(14px, 2vw, 20px)",
                        fontWeight: "600",
                        color: GREY_LIGHT,
                      }}
                    >
                      {sessionTime}
                    </div>
                    <div
                      style={{
                        padding: "clamp(4px, 0.6vw, 8px) clamp(12px, 1.5vw, 20px)",
                        borderRadius: "clamp(4px, 0.6vw, 8px)",
                        border: `2px solid ${GREY_BORDER}`,
                        background: `repeating-linear-gradient(-45deg, ${CARD_BG}, ${CARD_BG} 2px, ${GREY_MID} 2px, ${GREY_MID} 4px)`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: isLarge ? "clamp(18px, 2.6vw, 28px)" : "clamp(12px, 1.8vw, 18px)",
                          fontWeight: "700",
                          color: GOLD,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {getSessionTypeDisplay(client.nombre_plan)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      border: `1px dashed ${GREY_BORDER}`,
                      borderRadius: "clamp(4px, 0.6vw, 8px)",
                      backgroundColor: "#1a1814",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                      gap: "clamp(4px, 0.8vw, 8px)",
                    }}
                  >

                    {/* Tavros logo below */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        width: "100%",
                      }}
                    >
                      <img
                        src={logoSrc}
                        alt="Tavros"
                        style={{
                          width: "70%",
                          maxWidth: "clamp(80px, 16vw, 140px)",
                          height: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </div>
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
