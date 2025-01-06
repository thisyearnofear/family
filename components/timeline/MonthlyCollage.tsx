import Image from "next/image";
import { ImageProps } from "../../utils/types/types";

interface MonthlyCollageProps {
  images: ImageProps[];
  title?: string;
}

export default function MonthlyCollage({
  images,
  title = "A Year in Memories",
}: MonthlyCollageProps) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
        <div className="grid grid-cols-3 gap-4 p-4 max-w-4xl mx-auto">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.description || `Image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
