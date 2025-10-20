'use client';

import dynamic from "next/dynamic";
import React from "react";
import { VideoMockData } from "@/mockData/videos.mock";
import SingleVideo from "./Video-cards.component";

const GalleryComponent = dynamic(() => import("./Gallery.component"));
const TableComponent = dynamic(() => import("./Table.component"));

export interface CarrouselInterface {
  id: number;
  currentComponent: React.ComponentType<any>;
}

const carrouselComponents: CarrouselInterface[] = [
  { id: 1, currentComponent: TableComponent },
  { id: 2, currentComponent: SingleVideo }, 
  { id: 3, currentComponent: GalleryComponent },
];

const CarrouselWrapper = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (paused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carrouselComponents.length;
        
        // Increment gallery index when arriving at gallery (index 2)
        if (nextIndex === 2) {
          setCurrentGalleryIndex((prev) => prev + 1);
        }
        
        return nextIndex;
      });
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  React.useEffect(() => {
    if (carrouselComponents[currentIndex].id === 2) {
      setPaused(true); 
      setCurrentVideoIndex(0); 
    }
  }, [currentIndex]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < VideoMockData.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1); 
    } else {
      setPaused(false);
      setCurrentIndex((prev) => (prev + 1) % carrouselComponents.length);
    }
  };

  const handleGalleryEnd = () => {
    // Move to next carousel index (back to Table)
    setCurrentIndex((prev) => (prev + 1) % carrouselComponents.length);
    // Reset gallery index for next cycle
    setCurrentGalleryIndex(0);
  };

  const CurrentComponent = carrouselComponents[currentIndex].currentComponent;

  const componentProps =
    currentIndex === 1
      ? {
          youtubeLink: VideoMockData[currentVideoIndex]?.youtubeLink,
          title: VideoMockData[currentVideoIndex]?.videoTitle,
          videoDescription: VideoMockData[currentVideoIndex]?.description,
          onVideoEnd: handleVideoEnd,
        }
      : currentIndex === 2
      ? {
          externalIndex: currentGalleryIndex,
          onGalleryEnd: handleGalleryEnd,
        }
      : {};

  return (
    <div className="relative">
      <CurrentComponent {...componentProps} />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {carrouselComponents.map((component, index) => (
          <button
            key={component.id}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-blue-400" : "bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CarrouselWrapper;