'use client';

import React from "react";
import VideoCards from "./Video-cards.component";
import { useCarouselData } from "@/hooks/useCarouselData";

const VideoContainer = () => {
  const { data, isLoading, error } = useCarouselData();
  const videos = data?.videos ?? [];

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading videos...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load videos
      </div>
    );
  }

  const videoData = videos.filter(
    (item) => item.type === "video" && item.youtubeLink,
  );
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
