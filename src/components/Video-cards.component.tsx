'use client';

import React from "react";

interface SingleVideoProps {
  youtubeLink?: string;
  title?: string;
  videoDescription?: string;
}

const SingleVideo: React.FC<SingleVideoProps> = ({ youtubeLink, title, videoDescription }) => {
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) {
      return "";
    }
    // Handles both regular URLs and youtu.be short URLs, extracts video ID ignoring query params
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const videoId = match ? match[1] : null;
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0` : "";
    return embedUrl;
  };

  const embedUrl = getYoutubeEmbedUrl(youtubeLink);

  return (
    <div className="w-full h-screen bg-[#0f1419] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Video Container */}
      <div className="w-full max-w-4xl">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg p-6 flex flex-col">
          <h2 className="text-2xl font-semibold text-[#e4e9f1] mb-3">{title}</h2>
          <p className="text-[#cbd5e1] text-sm mb-6">{videoDescription}</p>

          {embedUrl ? (
            <div className="relative w-full pb-[90%] overflow-hidden rounded-lg mb-6">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full h-96 flex items-center justify-center bg-[#0f1419] text-[#475569] rounded-lg border border-[#334155] mb-6">
              No video available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleVideo;