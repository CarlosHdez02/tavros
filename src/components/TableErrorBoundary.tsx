"use client";

import React from "react";
import { isChunkLoadError, safeReload } from "@/utils/recovery";

/** How long the fallback stays before we try to render the carousel again. */
const AUTO_RESET_MS = 10_000;
/** If it keeps crashing this many times in a row, fall back to a safe reload. */
const MAX_CONSECUTIVE_RESETS = 5;

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

  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveResets = 0;
  private healthyTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Table/display error:", error, errorInfo);
    if (this.healthyTimer) {
      clearTimeout(this.healthyTimer);
      this.healthyTimer = null;
    }
    if (isChunkLoadError(error)) {
      safeReload("chunk load error in carousel");
    }
    // Never stay stuck on the fallback: try rendering the carousel again shortly.
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.resetTimer = null;
      this.consecutiveResets += 1;
      if (this.consecutiveResets >= MAX_CONSECUTIVE_RESETS) {
        safeReload("carousel kept crashing");
      }
      this.setState({ hasError: false });
    }, AUTO_RESET_MS);
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    // Back to healthy: after a minute without errors, forget previous crashes.
    if (prevState.hasError && !this.state.hasError) {
      if (this.healthyTimer) clearTimeout(this.healthyTimer);
      this.healthyTimer = setTimeout(() => {
        this.consecutiveResets = 0;
        this.healthyTimer = null;
      }, 60_000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    if (this.healthyTimer) clearTimeout(this.healthyTimer);
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
          <div
            style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            Sin sesión activa
          </div>
          <div
            style={{
              fontSize: "clamp(14px, 2vw, 18px)",
              color: "#B8B8B8",
              textAlign: "center",
            }}
          >
            No hay clases en este momento
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
