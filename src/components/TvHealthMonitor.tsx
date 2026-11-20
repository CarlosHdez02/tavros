"use client";

import React from "react";
import { startTvHealthMonitor } from "@/utils/tvHealth";

/** Renders nothing. Tracks TV crashes / memory and reports them (see utils/tvHealth.ts). */
export default function TvHealthMonitor() {
  React.useEffect(() => {
    try {
      return startTvHealthMonitor();
    } catch {
      // monitoring must never break the display
      return undefined;
    }
  }, []);
  return null;
}
