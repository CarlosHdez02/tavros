'use client';

import React from "react";

interface SingleVideoProps {
  youtubeLink?: string | null;
  title?: string | null;
  videoDescription?: string | null;
}

const SingleVideo: React.FC<SingleVideoProps> = ({ youtubeLink, title }) => {
  const getYoutubeEmbedUrl = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.searchParams.get("v");

    if (!videoId) return "https://www.youtube.com/watch?v=pT4l9uV98fM&autoplay=1";
    
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
  } catch {
    return "";
  }
};


  const embedUrl = getYoutubeEmbedUrl(youtubeLink);
  console.log(youtubeLink)

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0f1419] flex flex-col items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative w-full h-full">
        {embedUrl ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title ?? "video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0f1419] text-[#475569]">
            ⚠️ Video not available
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleVideo;
