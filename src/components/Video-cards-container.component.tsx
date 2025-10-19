import React from "react";
import { VideoMockData } from "@/mockData/videos.mock";
import VideoCards from "./Video-cards.component";

const VideoContainer = () => {
  return (
    <div className="hover:ease-in-ut p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {VideoMockData.map((video) => (
        <VideoCards
          key={video.id}
          id={video.id}
          title={video.videoTitle}
          videoDescription={video.description}
          youtubeLink={video.youtubeLink}
        />
      ))}
    </div>
  );
};

export default VideoContainer;
