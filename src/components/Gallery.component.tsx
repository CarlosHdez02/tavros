import { ImageGallery } from "@/mockData/Gallery.mock";
import Image from "next/image";

const Gallery = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ImageGallery.map((image) => (
          <div
            key={image.id}
            className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg hover:shadow-xl hover:border-[#60a5fa] hover:-translate-y-1 transition-all duration-150 ease-in-out overflow-hidden group cursor-pointer"
          >
            <div className="relative w-full h-64 overflow-hidden">
              <Image
                src={image.image}
                alt={`Gallery image ${image.id}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="p-4 bg-[#1e293b]">
              <p className="text-[#e4e9f1] text-sm font-semibold truncate">
                {image.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;