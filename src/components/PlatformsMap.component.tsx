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

/** Entrance cell - door with arc, yellow accents (top right) */
const EntranceCell = () => (
  <div
    style={{
      gridColumn: "5",
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
      overflow: "hidden",
      minWidth: 0,
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
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
        marginTop: "clamp(4px, 0.8vw, 8px)",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: "clamp(14px, 5vh, 32px)",
          fontWeight: "800",
          color: GOLD,
          textTransform: "uppercase",
          letterSpacing: "0.50em",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          lineHeight: 1.2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Entrada
      </span>
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
  const base = mapped ? mapped.toUpperCase() : (() => {
    const lower = nombrePlan.toLowerCase();
    if (lower.includes("grupal")) return "GRUPAL";
    if (lower.includes("semiprivad")) return "SEMIPRIVADA";
    if (lower.includes("privad")) return "PRIVADA";
    if (lower.includes("open gym")) return "OPEN GYM";
    return nombrePlan.substring(0, 12).toUpperCase();
  })();
  return base;
};

/** Parse fecha_creacion to timestamp for sorting. Handles "YYYY-MM-DD" and "DD/MM HH:mm:ss". */
const parseFechaCreacion = (fc: string | undefined): number => {
  if (!fc || typeof fc !== "string") return 0;
  const t = fc.trim();
  const iso = Date.parse(t);
  if (!Number.isNaN(iso)) return iso;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, hh, min, sec] = m;
    const d = new Date(new Date().getFullYear(), parseInt(mm, 10) - 1, parseInt(dd, 10), parseInt(hh, 10), parseInt(min, 10), parseInt(sec, 10));
    return d.getTime();
  }
  return 0;
};

/** Extract first surname, including composed forms (e.g. "de la Rosa", "del Castillo") */
const getFirstLastName = (lastName: string): string => {
  const parts = (lastName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const p0 = parts[0].toLowerCase();
  const p1 = parts[1]?.toLowerCase();
  // "de la X", "de las X", "de los X" → 3 words
  if (p0 === "de" && (p1 === "la" || p1 === "las" || p1 === "los") && parts[2])
    return parts.slice(0, 3).join(" ");
  // "van de X" → 3 words
  if (p0 === "van" && p1 === "de" && parts[2])
    return parts.slice(0, 3).join(" ");
  // "del X", "de X", "van X", "von X" → 2 words
  if ((p0 === "del" || p0 === "de" || p0 === "van" || p0 === "von") && parts[1])
    return parts.slice(0, 2).join(" ");
  return parts[0];
};

/** Show only first first name + first last name (e.g. "Evelyn Romero", "Jose Gonzalez") */
const truncateName = (firstName: string, lastName: string, maxLen = 20): string => {
  const firstFirstName = (firstName ?? "").trim().split(/\s+/)[0] ?? "";
  const firstLast = getFirstLastName(lastName ?? "");
  const full = `${firstFirstName} ${firstLast}`.trim();
  if (full.length <= maxLen) return full;
  return `${full.substring(0, maxLen - 3)}...`;
};

const PlatformsMap: React.FC<PlatformsMapProps> = ({ reservations, sessionTime = "—", size = "default" }) => {
  // Assign platforms by fecha_creacion ascending: oldest → platform 1, second oldest → 2, etc. (fila ignored)
  const platformAssignments = React.useMemo(() => {
    const sorted = [...reservations].sort(
      (a, b) => parseFechaCreacion(a.fecha_creacion) - parseFechaCreacion(b.fecha_creacion)
    );
    const map = new Map<number, Reservation>();
    sorted.slice(0, TOTAL_PLATFORMS).forEach((r, i) => {
      map.set(i + 1, r);
    });
    return map;
  }, [reservations]);

  const isLarge = size === "large";

  // Platform positions per layout: 9-10 at top; row 2: 8,6,4,2; row 3: 7,5,3,1. [col, row, colSpan]
  const platformLayout: [number, number, number][] = [
    [4, 3, 1], [4, 2, 1], [3, 3, 1], [3, 2, 1], // 1-4
    [2, 3, 1], [2, 2, 1], [1, 3, 1], [1, 2, 1], // 5-8
    [1, 1, 2], [3, 1, 2], // 9-10 (top)
  ];

  return (
    <div
      data-testid="platforms-map"
      style={{
        width: "100%",
        height: isLarge ? "100%" : "auto",
        marginTop: isLarge ? 0 : "clamp(12px, 2vw, 20px)",
        padding: isLarge ? "clamp(16px, 2.5vw, 32px)" : "clamp(8px, 1.5vw, 16px)",
        backgroundColor: "#2d2a24",
        border: "none",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr minmax(40px, 6%)",
          gridTemplateRows: isLarge ? "1fr 1fr 1fr" : "auto auto auto",
          gap: 0,
          width: "100%",
          minWidth: 0,
          flex: isLarge ? 1 : undefined,
          minHeight: isLarge ? 0 : "clamp(320px, 50vh, 500px)",
          borderTop: `2px solid ${GOLD}`,
          borderRight: `2px solid ${GOLD}`,
          overflow: "hidden",
        }}
      >
        <EntranceCell />
        {Array.from({ length: TOTAL_PLATFORMS }, (_, i) => {
          const platformNum = i + 1;
          const client = platformAssignments.get(platformNum);
          const isActive = !!client;
          const layout = platformLayout[i] ?? [1, 1, 1];
          const [col, row, colSpan] = [layout[0] ?? 1, layout[1] ?? 1, layout[2] ?? 1];

          const logoSrc = typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src;
          return (
            <div
              key={platformNum}
              style={{
                position: "relative",
                gridColumn: `${col} / span ${colSpan}`,
                gridRow: row,
                minHeight: isLarge ? "clamp(100px, 14vh, 200px)" : "clamp(90px, 12vw, 140px)",
                minWidth: 0,
                backgroundColor: CARD_BG,
                border: "none",
                borderRadius: "clamp(6px, 1vw, 12px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: isLarge ? "clamp(12px, 2vw, 24px)" : "clamp(8px, 1.5vw, 14px)",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {isActive && <HatchPattern id={`hatch-platform-${platformNum}`} />}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  overflow: "hidden",
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
                    minWidth: 0,
                    flex: 1,
                    border: "none",
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
                    {truncateName(client.name, client.last_name, 20)}
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
                  {/* Row 3: Class type (below logo) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        padding: "clamp(2px, 0.4vw, 6px) clamp(6px, 1vw, 12px)",
                        borderRadius: "clamp(4px, 0.6vw, 8px)",
                        border: "none",
                        background: `repeating-linear-gradient(-45deg, ${CARD_BG}, ${CARD_BG} 2px, ${GREY_MID} 2px, ${GREY_MID} 4px)`,
                        maxWidth: "100%",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontSize: isLarge ? "clamp(9px, 1.2vw, 16px)" : "clamp(7px, 1vw, 12px)",
                          fontWeight: "700",
                          color: GOLD,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          display: "block",
                          textAlign: "center",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          lineHeight: 1.2,
                          maxWidth: "100%",
                        }}
                      >
                        {getSessionTypeDisplay(client.nombre_plan)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    flex: 1,
                    border: "none",
                    borderRadius: "clamp(4px, 0.6vw, 8px)",
                    backgroundColor: "#1a1814",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                  }}
                />
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
