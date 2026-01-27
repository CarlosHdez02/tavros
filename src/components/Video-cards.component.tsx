import React from "react";
import YouTube, { YouTubeProps } from "react-youtube";

interface SingleVideoProps {
  youtubeLink?: string | null;
  title?: string | null;
  videoDescription?: string | null;
  onVideoEnd?: () => void;
}

const SingleVideo: React.FC<SingleVideoProps> = ({
  youtubeLink,
  title,
  onVideoEnd,
}) => {
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!youtubeLink) {
      setVideoId(null);
      return;
    }

    const cleanUrl = youtubeLink.trim();
    try {
      const parsedUrl = new URL(cleanUrl);
      let id = parsedUrl.searchParams.get("v");

      if (!id) {
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        if (
          pathSegments.length > 0 &&
          (pathSegments[0] === "shorts" ||
            pathSegments[0] === "embed" ||
            pathSegments[0] === "v" ||
            parsedUrl.hostname.includes("youtu.be"))
        ) {
          if (parsedUrl.hostname.includes("youtu.be")) {
            id = pathSegments[0];
          } else {
            id = pathSegments[1];
          }
        }
      }
      setVideoId(id || null);
    } catch {
      setVideoId(null);
    }
  }, [youtubeLink]);

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    // Force settings just in case
    event.target.setPlaybackQuality("hd1080");
  };

  const onStateChange: YouTubeProps["onStateChange"] = (event) => {
    // 0 = ended
    if (event.data === 0 && onVideoEnd) {
      onVideoEnd();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      fs: 0,
      vq: "hd1080", // Hint for 1080p
    },
  };

  return (
    <div className="w-full h-screen bg-[#0f1419] flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative w-full h-full">
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            className="absolute top-0 left-0 w-full h-full"
            iframeClassName="w-full h-full"
            title={title ?? "video"}
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
