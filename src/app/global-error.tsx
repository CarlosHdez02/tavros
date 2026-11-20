"use client";

import React from "react";
import { safeReload } from "@/utils/recovery";

/**
 * Last-resort error UI (errors in the root layout / providers). Must render its own
 * <html>/<body>. Keeps the screen dark and reloads once the server is reachable.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error:", error);
    const t = setTimeout(() => {
      try {
        reset();
      } catch {
        // ignore — reload below
      }
    }, 5_000);
    const fallback = setTimeout(
      () => safeReload("global error persisted"),
      30_000,
    );
    return () => {
      clearTimeout(t);
      clearTimeout(fallback);
    };
  }, [error, reset]);

  return (
    <html lang="es" style={{ backgroundColor: "#0f1419" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
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
      </body>
    </html>
  );
}
