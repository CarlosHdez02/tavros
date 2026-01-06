"use client";

import React from "react";

interface SingleVideoProps {
  youtubeLink?: string | null;
  title?: string | null;
  videoDescription?: string | null;
}

const SingleVideo: React.FC<SingleVideoProps> = ({ youtubeLink, title }) => {
  const getYoutubeEmbedUrl = (url?: string | null) => {
    if (!url) return "";
    const cleanUrl = url.trim();

    try {
      const parsedUrl = new URL(cleanUrl);
      let videoId = parsedUrl.searchParams.get("v");

      // Handle YouTube Shorts or path-based IDs (e.g. /embed/, /v/, /shorts/)
      if (!videoId) {
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        if (
          pathSegments.length > 0 &&
          (pathSegments[0] === "shorts" ||
            pathSegments[0] === "embed" ||
            pathSegments[0] === "v" ||
            parsedUrl.hostname.includes("youtu.be"))
        ) {
          // For youtu.be, the ID is the first segment. For shorts/embed/v, it's the second usually,
          // but split logic: /shorts/ID -> ["shorts", "ID"].
          // If hostname is youtu.be, path is /ID -> ["ID"].
          if (parsedUrl.hostname.includes("youtu.be")) {
            videoId = pathSegments[0];
          } else {
            videoId = pathSegments[1]; // e.g. shorts/ID
          }
        }
      }

      if (!videoId) return "";

      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
    } catch {
      return "";
    }
  };

  const embedUrl = getYoutubeEmbedUrl(youtubeLink);

  return (
    <div className="w-full h-screen bg-[#0f1419] flex flex-col items-center justify-center relative">
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
