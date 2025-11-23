'use client';

import React from "react";
import VideoCards from "./Video-cards.component";
import { useCarouselData } from "@/hooks/useCarouselData";

const VideoContainer = () => {
  const { data, loading, error } = useCarouselData();

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading videos...
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load videos
      </div>
    );
  }

  // Filter only valid videos
  const videoData = data.filter(
    (item) => item.type === "video" && item.youtubeLink
  );

  console.log(videoData)
  debugger
  return (
    <div className="hover:ease-in-ut p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videoData.map((video) => (
        <VideoCards
          key={video.id}
          title={video.title}
          videoDescription={video.description}
          youtubeLink={video.youtubeLink}
        />
      ))}
    </div>
  );
};

export default VideoContainer;
