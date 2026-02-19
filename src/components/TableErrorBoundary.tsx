"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches React errors in Table/carousel subtree and shows fallback UI instead of white screen.
 * Prevents blank screen when last class ends at hour boundary or any render error occurs.
 */
export class TableErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Table/display error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a1a",
            color: "#E8B44F",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: "700", marginBottom: "16px" }}>
            Sin sesión activa
          </div>
          <div style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#B8B8B8", textAlign: "center" }}>
            No hay clases en este momento
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
