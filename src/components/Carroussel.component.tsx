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
  const { data, isLoading } = useCarouselData();
  const rows = data?.all ?? [];
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideStartRef = React.useRef<number>(0);

  // Build carousel components from API data - filter out invalid types
  const carrouselComponents = React.useMemo(() => {
    if (!rows.length) return [];

    return rows
      .map((row, index) => ({
        id: (row?.id != null && !Number.isNaN(Number(row.id)) ? Number(row.id) : index + 1),
        currentComponent: componentMap[row.type],
        type: row.type,
        data: row,
      }))
      .filter((item) => item.currentComponent != null);
  }, [rows]);

  // Get current item data - with safety check (undefined/null indices → 0)
  const currentItem = React.useMemo(() => {
    const len = carrouselComponents.length;
    if (len === 0) return null;
    const idx = Number(currentIndex);
    const safeIndex = (Number.isNaN(idx) ? 0 : Math.max(0, idx)) % len;
    return carrouselComponents[safeIndex] ?? null;
  }, [carrouselComponents, currentIndex]);

  // durationSeconds from Excel - fallback 10s if missing/invalid (null/undefined/NaN → 0)
  const currentDuration = React.useMemo(() => {
    const raw = currentItem?.data?.durationSeconds;
    let seconds = 0;
    if (typeof raw === "number" && !Number.isNaN(raw)) seconds = raw;
    else if (typeof raw === "string") {
      const parsed = parseInt(raw, 10);
      seconds = Number.isNaN(parsed) ? 0 : parsed;
    }
    const ms = seconds > 0 ? seconds * 1000 : 10000;
    return Math.max(1000, ms); // Minimum 1s to prevent rapid-fire
  }, [currentItem]);

  // Advance to next slide - only the timer uses this for automatic advance (durationSeconds)
  const advanceToNext = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const len = carrouselComponents.length;
    if (len === 0) return;
    setCurrentIndex((prevIndex) => {
      const prev = Number.isNaN(Number(prevIndex)) ? 0 : Math.max(0, prevIndex);
      const nextIndex = (prev + 1) % len;
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

  // Precise timer: setTimeout + performance.now() to avoid 2-5s early advancement
  // Dependencies intentionally exclude carrouselComponents/advanceToNext so the 60s
  // refetch in useCarouselData does NOT reset the timer
  React.useEffect(() => {
    if (isLoading || carrouselComponents.length === 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    slideStartRef.current = performance.now();

    const scheduleTick = (remainingMs: number) => {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const elapsed = performance.now() - slideStartRef.current;
        // Only advance when full duration elapsed (50ms tolerance for timer jitter)
        if (elapsed >= currentDuration - 50) {
          advanceToNextRef.current();
        } else {
          scheduleTick(currentDuration - elapsed);
        }
      }, remainingMs);
    };

    scheduleTick(currentDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, currentIndex, currentDuration]);

  const handlePrev = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const len = carrouselComponents.length;
    if (len === 0) return;
    setCurrentIndex((prev) => {
      const p = Number.isNaN(Number(prev)) ? 0 : Math.max(0, prev);
      const newIndex = p - 1;
      return newIndex < 0 ? len - 1 : newIndex;
    });
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  const handleNext = () => {
    advanceToNext();
  };

  const handleDotClick = (index: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const len = carrouselComponents.length;
    if (len === 0) return;
    const safeIdx = Math.max(0, Math.min(Number(index) || 0, len - 1));
    setCurrentIndex(safeIdx);
    setCurrentVideoIndex(0);
    setCurrentGalleryIndex(0);
  };

  // Loading state
  if (isLoading) {
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
      :       currentItem.type === "gallery"
        ? {
            externalIndex: Number.isNaN(Number(currentGalleryIndex)) ? 0 : Math.max(0, currentGalleryIndex ?? 0),
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
