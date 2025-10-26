'use client';

import dynamic from "next/dynamic";
import React from "react";
import { useCarouselData } from "@/hooks/useCarouselData";
import SingleVideo from "./Video-cards.component";

const GalleryComponent = dynamic(() => import("./Gallery.component"));
const TableComponent = dynamic(() => import("./Table.component"));

export interface CarrouselInterface {
  id: number;
  currentComponent: React.ComponentType<any>;
  type: 'table' | 'video' | 'gallery';
}

const componentMap = {
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

  // Build carousel components from CSV data
  const carrouselComponents = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index + 1,
      currentComponent: componentMap[row.type],
      type: row.type,
      data: row
    }));
  }, [data]);

  // Get current item data
  const currentItem = carrouselComponents[currentIndex];
  const currentDuration = currentItem?.data?.durationSeconds 
    ? currentItem.data.durationSeconds * 1000 
    : 6000; // Default 6 seconds

  // Get all video items for video cycling
  const videoItems = React.useMemo(() => {
    return data.filter(item => item.type === 'video' && item.youtubeLink);
  }, [data]);

  // Main carousel interval
  React.useEffect(() => {
    if (loading || carrouselComponents.length === 0) return;
    
    // Don't auto-advance if we're on a video type (videos handle their own timing)
    if (currentItem?.type === 'video') return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carrouselComponents.length;
        
        // Increment gallery index when arriving at gallery
        if (carrouselComponents[nextIndex]?.type === 'gallery') {
          setCurrentGalleryIndex((prev) => prev + 1);
        }
        
        // Reset video index when arriving at video section
        if (carrouselComponents[nextIndex]?.type === 'video') {
          setCurrentVideoIndex(0);
        }
        
        return nextIndex;
      });
    }, currentDuration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading, carrouselComponents, currentIndex, currentDuration, currentItem?.type]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < videoItems.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      // Move to next carousel section after all videos
      setCurrentIndex((prev) => (prev + 1) % carrouselComponents.length);
      setCurrentVideoIndex(0);
    }
  };

  const handleGalleryEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % carrouselComponents.length);
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
    currentItem?.type === 'video'
      ? {
          youtubeLink: videoItems[currentVideoIndex]?.youtubeLink,
          //title: videoItems[currentVideoIndex]?.,
          //videoDescription: videoItems[currentVideoIndex]?.description,
          onVideoEnd: handleVideoEnd,
        }
      : currentItem?.type === 'gallery'
      ? {
          externalIndex: currentGalleryIndex,
          onGalleryEnd: handleGalleryEnd,
        }
      : {};

  return (
    <div className="relative">
      <CurrentComponent {...componentProps as any} />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {carrouselComponents.map((component, index) => (
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

export default CarrouselWrapper;