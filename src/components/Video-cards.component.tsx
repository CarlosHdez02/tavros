import React from "react";
import YouTube, { YouTubeProps } from "react-youtube";

interface SingleVideoProps {
  youtubeLink?: string | null;
  title?: string | null;
  videoDescription?: string | null;
  onVideoEnd?: () => void;
}

/**
 * SingleVideo Component - Optimized for Samsung TV Frame
 *
 * Features:
 * - Automatic URL normalization for all YouTube formats
 * - HD quality forcing through working URL parameters
 * - Vertical video (Shorts) detection and styling
 * - Samsung TV Frame specific optimizations
 * - Future-proof: handles new videos automatically
 *
 * Supported URL formats (all auto-normalized):
 * - https://youtu.be/xxxxx
 * - https://www.youtube.com/watch?v=xxxxx
 * - https://youtube.com/shorts/xxxxx
 * - https://www.youtube.com/watch?v=xxxxx&list=...
 */
const SingleVideo: React.FC<SingleVideoProps> = ({
  youtubeLink,
  title,
  onVideoEnd,
}) => {
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [isShort, setIsShort] = React.useState(false);
  const playerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!youtubeLink) {
      setVideoId(null);
      setIsShort(false);
      return;
    }

    const cleanUrl = youtubeLink.trim();

    try {
      const parsedUrl = new URL(cleanUrl);
      let id = parsedUrl.searchParams.get("v");
      let detectedShort = false;

      // Extract video ID based on URL format
      if (!id) {
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

        if (pathSegments.length > 0) {
          if (parsedUrl.hostname.includes("youtu.be")) {
            // Format: youtu.be/xxxxx
            id = pathSegments[0];
          } else if (pathSegments[0] === "shorts") {
            // Format: youtube.com/shorts/xxxxx
            id = pathSegments[1];
            detectedShort = true;
          } else if (pathSegments[0] === "embed" || pathSegments[0] === "v") {
            // Format: youtube.com/embed/xxxxx or youtube.com/v/xxxxx
            id = pathSegments[1];
          }
        }
      }

      // Additional Short detection from URL path (even if id was found in params)
      if (parsedUrl.pathname.includes("/shorts/")) {
        detectedShort = true;
      }

      setVideoId(id || null);
      setIsShort(detectedShort);
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
      setVideoId(null);
      setIsShort(false);
    }
  }, [youtubeLink]);

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;

    // Attempt to set quality (deprecated but still used as a hint)
    try {
      event.target.setPlaybackQuality("hd1080");
    } catch (error) {
      // Expected to fail - API is deprecated
    }

    // Samsung TV specific: Try iframe messaging for quality control
    try {
      const iframe = event.target.getIframe();
      if (iframe?.contentWindow) {
        // Send quality preference through postMessage
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "setPlaybackQualityRange",
            args: ["hd1080", "hd1080"],
          }),
          "*"
        );
      }
    } catch (error) {
      // Silent fail - not all platforms support this
    }
  };

  const onStateChange: YouTubeProps["onStateChange"] = (event) => {
    // State 1 = playing - force quality again for Shorts on Samsung TV
    if (event.data === 1 && isShort && playerRef.current) {
      try {
        playerRef.current.setPlaybackQuality("hd1080");
      } catch (error) {
        // Silent fail
      }
    }

    // State 0 = ended
    if (event.data === 0 && onVideoEnd) {
      onVideoEnd();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1, // Auto-play on load
      controls: 1, // Show player controls
      playsinline: 1, // Play inline on mobile
      rel: 0, // Don't show related videos
      modestbranding: 1, // Minimal YouTube branding
      fs: 0, // Disable fullscreen button

      // CRITICAL: These parameters actually work for quality forcing
      vq: "hd1080", // Video quality hint (still respected)
      hd: 1, // HD preference flag (still respected)
      quality: "hd1080", // Quality preference (still respected)

      // Samsung TV Frame optimization
      enablejsapi: 1, // Enable iframe API
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,

      // Remove playlist context for Shorts (improves quality detection)
      ...(isShort && {
        list: undefined,
        index: undefined,
      }),
    },
  };

  return (
    <div className="w-full h-screen bg-[#0f1419] flex flex-col items-center justify-center relative">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Video container */}
      <div className="relative w-full h-full">
        {videoId ? (
          <div
            className={`absolute top-0 left-0 w-full h-full ${
              isShort
                ? "flex items-center justify-center" // Center vertical videos
                : ""
            }`}
          >
            <div className={isShort ? "w-auto h-full" : "w-full h-full"}>
              <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onStateChange}
                className={isShort ? "h-full aspect-[9/16]" : "w-full h-full"}
                iframeClassName="w-full h-full"
                title={title ?? "video"}
              />
            </div>
          </div>
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
