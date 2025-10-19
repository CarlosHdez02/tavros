'use client';

import React from "react";

interface VideoCardsProps {
  id: number;
  title: string;
  videoDescription: string;
  image?: string;
  youtubeLink?: string;
}

const VideoCards: React.FC<VideoCardsProps> = ({ title, videoDescription, youtubeLink }) => {
  // Helper to convert a YouTube link to an embeddable URL
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return "";
    const match = url.match(/v=([^&]+)/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const embedUrl = getYoutubeEmbedUrl(youtubeLink);

  return (
    <div className=" overflow-none bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg hover:shadow-xl hover:border-[#60a5fa] hover:-translate-y-1 transition-all duration-150 ease-in-out p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-[#e4e9f1] mb-2">{title}</h2>
      <p className="text-[#cbd5e1] text-sm mb-4">{videoDescription}</p>

      {embedUrl ? (
        <div className="relative w-full pb-[56.25%] overflow-hidden rounded-lg">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-[#0f1419] text-[#475569] rounded-lg border border-[#334155]">
          No video available
        </div>
      )}
    </div>
  );
};

export default VideoCards;