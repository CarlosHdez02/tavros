"use client";

import dynamic from "next/dynamic";
import React from "react";
import SingleVideo from "./Video-cards.component";
import { useCarouselData } from "@/hooks/useCarouselData";

const GalleryComponent = dynamic(() => import("./Gallery.component"));
const TableDevComponent = dynamic(() => import("./TableDev.component"));

export interface CarrouselInterface {
  id: number;
  currentComponent: React.ComponentType<any>;
  type: "table" | "video" | "gallery";
}

export const componentMapDev = {
  table: TableDevComponent,
  video: SingleVideo,
  gallery: GalleryComponent,
};

const CarrouselDev = () => {
  const { data, loading } = useCarouselData();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Build carousel components from API
  const carouselComponents = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return (
      data
        // 1️⃣ Remove rows with no valid component
        .filter((row) => componentMapDev[row.type])

        // 2️⃣ Remove broken videos (youtubeLink null)
        .filter(
          (row) =>
            row.type !== "video" || (row.type === "video" && row.youtubeLink)
        )

        // 3️⃣ Map into the usable structure
        .map((row, index) => ({
          id: row.id ?? index + 1,
          currentComponent: componentMapDev[row.type],
          type: row.type,
          data: row,
        }))
    );
  }, [data]);

  // Current item being displayed
  const currentItem = carouselComponents[currentIndex];

  // FIXED: correct duration conversion
  const currentDuration = currentItem?.data?.durationSeconds
    ? currentItem.data.durationSeconds * 100
    : 6000; // default 6s

  // Auto-rotation logic
  React.useEffect(() => {
    if (loading || carouselComponents.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const next = (prevIndex + 1) % carouselComponents.length;

        if (carouselComponents[next]?.type === "gallery") {
          setCurrentGalleryIndex((prev) => prev + 1);
        }

        return next;
      });
    }, currentDuration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading, carouselComponents, currentIndex, currentDuration]);

  const handleGalleryEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselComponents.length);
    setCurrentGalleryIndex(0);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-[#60a5fa] text-xl">Loading carousel...</div>
      </div>
    );
  }

  // No data
  if (carouselComponents.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-[#e4e9f1] text-xl">
          No carousel data available
        </div>
      </div>
    );
  }

  const CurrentComponent = currentItem.currentComponent;

  const componentProps =
    currentItem.type === "gallery"
      ? {
          externalIndex: currentGalleryIndex,
          onGalleryEnd: handleGalleryEnd,
        }
      : currentItem.data;

  return (
    <div className="relative">
      <CurrentComponent {...(componentProps as any)} />

      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {carouselComponents.map((component, index) => (
          <button
            key={component.id}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-blue-400" : "bg-gray-500"
            }`}
            title={component.data.type}
          />
        ))}
      </div>
    </div>
  );
};

export default CarrouselDev;
