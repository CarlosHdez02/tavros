"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useCarouselData } from "@/hooks/useCarouselData";
import SingleVideo from "./Video-cards.component";

const GalleryComponent = dynamic(() => import("./Gallery.component"));
const TableComponent = dynamic(() => import("./Table.component"));

export interface CarrouselInterface {
  id: number;
  currentComponent: React.ComponentType<any>;
  type: "table" | "video" | "gallery";
}

export const componentMap = {
  table: TableComponent,
  video: SingleVideo,
  gallery: GalleryComponent,
};

const CarrouselWrapper = () => {
  const { data, loading } = useCarouselData();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = React.useState(0);
  const [isManualOverride, setIsManualOverride] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Build carousel components from CSV data
  const carrouselComponents = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => ({
      id: index + 1,
      currentComponent: componentMap[row.type],
      type: row.type,
      data: row,
    }));
  }, [data]);

  // Get current item data
  const currentItem = carrouselComponents[currentIndex];
  const currentDuration = currentItem?.data?.durationSeconds
    ? currentItem.data.durationSeconds * 1000
    : 10000; // Default 10 seconds

  // Main carousel interval
  // Main carousel interval
  React.useEffect(() => {
    if (loading || carrouselComponents.length === 0) return;

    // Use strict duration for everything
    const duration = currentDuration;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carrouselComponents.length;

        // Increment gallery index when arriving at gallery
        if (carrouselComponents[nextIndex]?.type === "gallery") {
          setCurrentGalleryIndex((prev) => prev + 1);
        }

        // Reset video index when arriving at video section (if locally needed)
        // But mainly we just switch slides now.
        if (carrouselComponents[nextIndex]?.type === "video") {
          setCurrentVideoIndex(0);
        }

        return nextIndex;
      });
    }, duration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    loading,
    carrouselComponents,
    currentIndex,
    currentDuration,
    // currentItem?.type, // No longer depending on type to switch behavior
    // isFrozen, // Removed
    // isManualOverride, // Removed logic that stops auto-advance on override,
    // but user said "if i manually change... display next video even if duration not over".
    // The manual override state might still be useful if we want to PAUSE the timer?
    // User request: "once its done with all the stages it will loop again".
    // Usually manual override just jumps, but timer should reset.
  ]);

  const handleVideoEnd = () => {
    // No-op: Duration controls navigation now
  };

  const handleGalleryEnd = () => {
    // No-op: Duration controls navigation now
  };

  // Navigation Handlers
  const handlePrev = () => {
    setIsManualOverride(true);
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? carrouselComponents.length - 1 : newIndex;
    });
    // Reset internal indices when switching manually
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  const handleNext = () => {
    setIsManualOverride(true);
    setCurrentIndex((prev) => (prev + 1) % carrouselComponents.length);
    // Reset internal indices when switching manually
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-[#60a5fa] text-xl">Loading carousel...</div>
      </div>
    );
  }

  if (carrouselComponents.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-[#e4e9f1] text-xl">No carousel data available</div>
      </div>
    );
  }

  const CurrentComponent = currentItem?.currentComponent;

  const componentProps =
    currentItem?.type === "video"
      ? {
          youtubeLink: currentItem.data?.youtubeLink,
          onVideoEnd: handleVideoEnd,
        }
      : currentItem?.type === "gallery"
      ? {
          externalIndex: currentGalleryIndex,
          onGalleryEnd: handleGalleryEnd,
        }
      : {};

  return (
    <div className="relative group">
      <CurrentComponent {...(componentProps as any)} />

      {/* Manual Navigation Controls - Visible on Hover or always? Let's keep them visible but subtle or hover group */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handlePrev}
          className="bg-[#3a3a3a]/80 hover:bg-[#E8B44F] text-[#E8B44F] hover:text-[#1a1a1a] border-2 border-[#E8B44F] rounded-full p-4 transition-all"
          title="Anterior"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleNext}
          className="bg-[#3a3a3a]/80 hover:bg-[#E8B44F] text-[#E8B44F] hover:text-[#1a1a1a] border-2 border-[#E8B44F] rounded-full p-4 transition-all"
          title="Siguiente"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 5L16 12L9 19"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {carrouselComponents.map((component, index) => (
          <button
            key={component.id}
            onClick={() => {
              setCurrentIndex(index);
              setIsManualOverride(true);
            }}
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

export default CarrouselWrapper;
