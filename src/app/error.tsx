"use client";

import React from "react";
import { isChunkLoadError, safeReload } from "@/utils/recovery";

const AUTO_RESET_MS = 5_000;

/**
 * Route-level error UI. Without this file Next.js falls back to its default
 * white "Application error" page, which on the TV stays until someone reloads.
 * Here we keep the dark background and recover on our own.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Route error:", error);
    if (isChunkLoadError(error)) {
      safeReload("chunk load error at route level");
      return;
    }
    const t = setTimeout(() => {
      try {
        reset();
      } catch {
        safeReload("route reset failed");
      }
    }, AUTO_RESET_MS);
    // If resetting keeps failing, a full reload is the last resort.
    const fallback = setTimeout(
      () => safeReload("route error persisted"),
      60_000,
    );
    return () => {
      clearTimeout(t);
      clearTimeout(fallback);
    };
  }, [error, reset]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f1419",
        color: "#e4e9f1",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 24, color: "#E8B44F", fontWeight: 700 }}>
        Tavros
      </div>
      <div style={{ marginTop: 8, color: "#64748b" }}>Actualizando…</div>
    </div>
  );
}
