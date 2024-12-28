import { useState } from "react";
import CustomImage from "./CustomImage";
import { motion } from "framer-motion";
import type { ImageProps } from "../../utils/types/types";

interface MonthlyCollageProps {
  images: ImageProps[];
  onImageClick?: (index: number) => void;
}

const MonthlyCollage: React.FC<MonthlyCollageProps> = ({
  images,
  onImageClick,
}) => {
  const [loadedImages, setLoadedImages] = useState<number[]>([]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => [...prev, index]);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => {
        const imageUrl = image.ipfsHash.startsWith("http")
          ? image.ipfsHash
          : `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;

        return (
          <motion.div
            key={image.ipfsHash}
            initial={{ opacity: 0 }}
            animate={{ opacity: loadedImages.includes(index) ? 1 : 0 }}
            className="relative aspect-square cursor-pointer group"
            onClick={() => onImageClick?.(index)}
          >
            <CustomImage
              src={imageUrl}
              alt={image.description || `Memory ${index + 1}`}
              className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
              onLoad={() => handleImageLoad(index)}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          </motion.div>
        );
      })}
    </div>
  );
};

export default MonthlyCollage;
