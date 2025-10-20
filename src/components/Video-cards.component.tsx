'use client';

import React from "react";

interface SingleVideoProps {
  youtubeLink: string;
  title: string;
  videoDescription: string;
}

const SingleVideo: React.FC<SingleVideoProps> = ({ youtubeLink, title }) => {
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return "";

    // Handles both long and short YouTube URLs
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0` : "";
  };

  const embedUrl = getYoutubeEmbedUrl(youtubeLink);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0f1419] flex flex-col items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Video Wrapper */}
      <div className="relative w-full h-full">
        {embedUrl ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0f1419] text-[#475569]">
            No video available
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleVideo;
