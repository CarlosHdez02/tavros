'use client'
import { ImageGallery } from "@/mockData/Gallery.mock";
import Image from "next/image";
import React from "react";

export interface GalleryProps{
  externalIndex?:number;
}
const Gallery:React.FC<GalleryProps> = ({externalIndex=0}) => {
  const [currentPicture, setCurrentPicture] = React.useState(externalIndex);

  React.useEffect(()=>{
    if(externalIndex !== undefined){
      setCurrentPicture(externalIndex % ImageGallery.length);
    }
  },[externalIndex])

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPicture((prev) => (prev + 1) % ImageGallery.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);


  const goToPrevious = () =>
    setCurrentPicture((prev) => (prev - 1 + ImageGallery.length) % ImageGallery.length);
  const goToNext = () =>
    setCurrentPicture((prev) => (prev + 1) % ImageGallery.length);

  const currentImage = ImageGallery[currentPicture];

  return (
    <div className="my-10 flex justify-center mx-2">
      <div className="relative w-full  h-[75vh] bg-[#0f1419] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out transform hover:scale-[1.01] hover:shadow-[0_10px_50px_rgba(0,0,0,0.4)]">
        {/* Animated Card Image */}
        <div className="relative w-full h-full transition-transform duration-700 ease-in-out">
          <Image
            src={currentImage?.image}
            alt={"image"}
            fill
            priority
            className="object-cover rounded-3xl"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-3xl"></div>

  
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
            <p className="text-3xl font-bold mb-2 drop-shadow-lg">
              {currentImage?.description ?? "img"}
            </p>
          </div>
        </div>

        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Gallery;
