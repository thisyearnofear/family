import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ImageProps } from "../utils/types";

interface MemoryImageProps {
  image: ImageProps;
  className?: string;
  onLoad?: () => void;
  isInteractive?: boolean;
}

const MemoryImage = ({
  image,
  className = "",
  onLoad,
  isInteractive = false,
}: MemoryImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const imageUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;

  const ImageWrapper = isInteractive ? motion.div : "div";
  const motionProps = isInteractive
    ? {
        whileHover: { scale: 1.02 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <ImageWrapper
      className={`relative w-full h-full overflow-hidden ${className}`}
      {...motionProps}
    >
      <Image
        src={imageUrl}
        alt={
          image.dateTaken
            ? new Date(image.dateTaken).toLocaleDateString()
            : "Memory"
        }
        fill
        priority={true}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={(event) => {
          setIsLoading(false);
          onLoad?.();
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </ImageWrapper>
  );
};

export default MemoryImage;
