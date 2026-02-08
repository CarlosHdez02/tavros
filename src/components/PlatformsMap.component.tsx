"use client";

import React from "react";
import type { Reservation } from "@/types/Table.type";
import { PLAN_MAPPING } from "@/types/Table.type";
import tavrosLogo from "../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png";

const TOTAL_PLATFORMS = 10;

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

  return (
    <div
      style={{
        width: "100%",
        height: isLarge ? "100%" : "auto",
        marginTop: isLarge ? 0 : "clamp(12px, 2vw, 20px)",
        padding: isLarge ? "clamp(16px, 2.5vw, 32px)" : "clamp(8px, 1.5vw, 16px)",
        backgroundColor: "#1a1a1a",
        borderRadius: "clamp(8px, 1.5vw, 16px)",
        border: "2px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: isLarge ? "1fr" : "auto",
          gap: isLarge ? "clamp(16px, 2.5vw, 32px)" : "clamp(8px, 1.5vw, 16px)",
          width: "100%",
          flex: isLarge ? 1 : undefined,
          minHeight: isLarge ? 0 : undefined,
        }}
      >
        {Array.from({ length: TOTAL_PLATFORMS }, (_, i) => {
          const platformNum = i + 1;
          const client = platformAssignments.get(platformNum);
          const isActive = !!client;

          const logoSrc = typeof tavrosLogo === "string" ? tavrosLogo : tavrosLogo.src;

          const isLastRow = platformNum >= 9;

          return (
            <div
              className="backdrop-filter-2xl"
              key={platformNum}
              style={{
                position: "relative",
                gridColumn: isLastRow ? (platformNum === 9 ? 2 : 3) : undefined,
                minHeight: isLarge ? "clamp(140px, 18vh, 280px)" : "clamp(72px, 12vw, 120px)",
                borderRadius: "clamp(8px, 1.2vw, 16px)",
                backgroundColor: isActive
                  ? "rgba(37, 37, 32, 0.45)"
                  : "rgba(30, 30, 30, 0.4)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isActive
                  ? "1px solid rgba(232, 180, 79, 0.5)"
                  : "1px dashed rgba(58, 58, 58, 0.6)",
                boxShadow: isActive
                  ? "inset 0 0 0 1px rgba(232, 180, 79, 0.2)"
                  : "inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: isLarge ? "clamp(16px, 2.5vw, 28px)" : "clamp(8px, 1.5vw, 14px)",
                overflow: "hidden",
              }}
            >
              {/* Logo watermark - visible through glass effect */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    width: "70%",
                    height: "70%",
                    objectFit: "contain",
                    filter: "brightness(1.3)",
                  }}
                />
              </div>
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
                  color: isActive ? "#E8B44F" : "#4a4a4a",
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
                      backgroundColor: "rgba(13, 13, 13, 0.7)",
                      borderRadius: "clamp(4px, 0.8vw, 8px)",
                      padding: isLarge ? "clamp(12px, 1.8vw, 20px)" : "clamp(6px, 1vw, 10px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Logo in active platform content area */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.35,
                        pointerEvents: "none",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoSrc}
                        alt=""
                        style={{
                          width: "60%",
                          height: "60%",
                          objectFit: "contain",
                          filter: "brightness(1.4)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(28px, 4vw, 48px)" : "clamp(14px, 2.2vw, 22px)",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncateName(client.name, client.last_name)}
                    </div>
                    <div
                      style={{
                        fontSize: isLarge ? "clamp(18px, 2.5vw, 28px)" : "clamp(10px, 1.5vw, 14px)",
                        fontWeight: "600",
                        color: "#E8B44F",
                        marginTop: "2px",
                      }}
                    >
                      {getSessionTypeDisplay(client.nombre_plan)}
                    </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: isLarge ? "clamp(16px, 2.2vw, 24px)" : "clamp(9px, 1.4vw, 12px)",
                      fontWeight: "700",
                      color: "#E8B44F",
                      marginTop: isLarge ? "clamp(8px, 1.2vw, 14px)" : "clamp(4px, 0.8vw, 6px)",
                    }}
                  >
                    En uso
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      border: "1px dashed #3a3a3a",
                      borderRadius: "clamp(4px, 0.8vw, 8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: isLarge ? "clamp(80px, 12vh, 160px)" : "clamp(40px, 6vw, 64px)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isLarge ? "clamp(36px, 5vw, 56px)" : "clamp(18px, 3vw, 28px)",
                        color: "#3a3a3a",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: isLarge ? "clamp(16px, 2.2vw, 24px)" : "clamp(9px, 1.4vw, 12px)",
                      fontWeight: "600",
                      color: "#4a4a4a",
                      marginTop: isLarge ? "clamp(8px, 1.2vw, 14px)" : "clamp(4px, 0.8vw, 6px)",
                    }}
                  >
                    Disponible
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
