import { useState, useEffect } from "react";
import Image from "next/image";
import type { ImageProps } from "../utils/types";

interface LazyImageProps {
  image: ImageProps;
  className?: string;
  onLoad?: () => void;
}

const LazyImage = ({ image, className = "", onLoad }: LazyImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const url = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;
      setSrc(url);
    };
    loadImage();
  }, [image.ipfsHash]);

  if (!src) return null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={src}
        alt={
          image.dateTaken
            ? new Date(image.dateTaken).toLocaleDateString()
            : "Memory"
        }
        fill
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoad?.();
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
};

export default LazyImage;
