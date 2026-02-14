"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useCarouselData } from "@/hooks/useCarouselData";
import SingleVideo from "./Video-cards.component";

const CarouselLoadingPlaceholder = () => (
  <div
    className="flex items-center justify-center min-h-screen bg-[#0f1419]"
    style={{ minHeight: "100vh" }}
  >
    <div className="text-[#60a5fa] text-xl">Cargando...</div>
  </div>
);

const GalleryComponent = dynamic(() => import("./Gallery.component"), {
  loading: () => <CarouselLoadingPlaceholder />,
});
const TableComponent = dynamic(() => import("./Table.component"), {
  loading: () => <CarouselLoadingPlaceholder />,
});

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
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Build carousel components from CSV data - filter out invalid types
  const carrouselComponents = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((row, index) => ({
        id: index + 1,
        currentComponent: componentMap[row.type],
        type: row.type,
        data: row,
      }))
      .filter((item) => item.currentComponent != null);
  }, [data]);

  // Get current item data - with safety check
  const currentItem = React.useMemo(() => {
    if (carrouselComponents.length === 0) return null;
    // Ensure index is always valid
    const safeIndex = currentIndex % carrouselComponents.length;
    return carrouselComponents[safeIndex];
  }, [carrouselComponents, currentIndex]);

  // durationSeconds from Excel - fallback 10s if missing/invalid
  const currentDuration = React.useMemo(() => {
    const raw = currentItem?.data?.durationSeconds;
    const seconds =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseInt(raw, 10)
          : 0;
    const ms = seconds > 0 ? seconds * 1000 : 10000;
    return Math.max(1000, ms); // Minimum 1s to prevent rapid-fire
  }, [currentItem]);

  // Advance to next slide - only the timer uses this for automatic advance (durationSeconds)
  const advanceToNext = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % carrouselComponents.length;
      if (nextIndex === 0) {
        setCurrentGalleryIndex(0);
        setCurrentVideoIndex(0);
      } else {
        if (carrouselComponents[nextIndex]?.type === "gallery") {
          setCurrentGalleryIndex((prev) => prev + 1);
        }
        if (carrouselComponents[nextIndex]?.type === "video") {
          setCurrentVideoIndex(0);
        }
      }
      return nextIndex;
    });
  }, [carrouselComponents]);

  const advanceToNextRef = React.useRef(advanceToNext);
  advanceToNextRef.current = advanceToNext;

  // Main carousel interval - advances only when durationSeconds from Excel elapses
  // Dependencies intentionally exclude carrouselComponents/advanceToNext so the 60s
  // refetch in useCarouselData does NOT reset the timer (it was causing resets every 60s)
  React.useEffect(() => {
    if (loading || carrouselComponents.length === 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const tick = () => advanceToNextRef.current();
    intervalRef.current = setInterval(tick, currentDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading, currentIndex, currentDuration]);

  const handlePrev = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? carrouselComponents.length - 1 : newIndex;
    });
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  const handleNext = () => {
    advanceToNext();
  };

  const handleDotClick = (index: number) => {
    // Clear interval and restart it
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setCurrentIndex(index);
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-[#60a5fa] text-xl">Loading carousel...</div>
      </div>
    );
  }

  // No data from Excel - show message, refetch will retry
  if (carrouselComponents.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-screen bg-[#0f1419]"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-[#e4e9f1] text-xl text-center px-4">
          No hay datos
        </div>
      </div>
    );
  }

  // Safety check for current component
  if (!currentItem || !currentItem.currentComponent) {
    return (
      <div
        className="w-full min-h-screen bg-[#0f1419] flex items-center justify-center text-[#e4e9f1]"
        style={{ minHeight: "100vh" }}
      >
        <p>Cargando contenido...</p>
      </div>
    );
  }

  const CurrentComponent = currentItem.currentComponent;

  // Build component props based on type - advance only via durationSeconds (timer)
  const componentProps =
    currentItem.type === "video"
      ? {
          youtubeLink: currentItem.data?.youtubeLink,
        }
      : currentItem.type === "gallery"
        ? {
            externalIndex: currentGalleryIndex,
          }
        : {};

  return (
    <div className="relative group min-h-screen bg-[#0f1419]" style={{ minHeight: "100vh" }}>
      <CurrentComponent {...(componentProps as any)} />

      {/* Manual Navigation Controls - Left Arrow */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handlePrev}
          className="bg-[#3a3a3a]/80 hover:bg-[#E8B44F] text-[#E8B44F] hover:text-[#1a1a1a] border-2 border-[#E8B44F] rounded-full p-4 transition-all"
          title="Anterior"
          aria-label="Previous slide"
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

      {/* Manual Navigation Controls - Right Arrow */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleNext}
          className="bg-[#3a3a3a]/80 hover:bg-[#E8B44F] text-[#E8B44F] hover:text-[#1a1a1a] border-2 border-[#E8B44F] rounded-full p-4 transition-all"
          title="Siguiente"
          aria-label="Next slide"
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

      {/* Pagination Dots */}
      {/*      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {carrouselComponents.map((component, index) => (
          <button
            key={component.id}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-[#E8B44F] scale-125"
                : "bg-gray-500 hover:bg-gray-400"
            }`}
            title={`${component.data.type} - ${component.data.title}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div> */}
    </div>
  );
};

export default CarrouselWrapper;
