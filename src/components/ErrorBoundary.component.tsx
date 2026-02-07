"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="flex flex-col items-center justify-center w-full min-h-screen bg-[#0f1419] text-[#e4e9f1] p-8"
          style={{ minHeight: "100vh" }}
        >
          <div className="text-center max-w-md">
            <p className="text-xl font-semibold text-[#E8B44F] mb-4">
              Algo salió mal
            </p>
            <p className="text-[#94a3b8] mb-6">
              El contenido se actualizará automáticamente.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
