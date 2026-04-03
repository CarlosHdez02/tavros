"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates slide render / lazy-chunk failures so one bad row does not unmount the whole carousel.
 */
export class CarouselSlideErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Carousel slide error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full min-h-screen bg-[#0f1419] flex flex-col items-center justify-center text-[#e4e9f1] px-6"
          style={{ minHeight: "100vh" }}
          data-testid="carousel-slide-error"
        >
          <p className="text-xl text-center mb-2">
            No se pudo mostrar esta diapositiva
          </p>
          <p className="text-sm text-[#64748b] text-center">
            El carrusel continuará con la siguiente
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
