import Image from "next/image";
import { useState } from "react";
import type { ImageProps } from "../../utils/types/types";

interface MemoryImageProps {
  image: ImageProps;
  isInteractive?: boolean;
  className?: string;
  onLoad?: () => void;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  isInteractive = false,
  className = "",
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Construct the full URL for the image
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${
        process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
        "https://gateway.pinata.cloud/ipfs"
      }/${image.ipfsHash}`;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageUrl}
        alt={`Image taken on ${image.dateTaken || "unknown date"}`}
        className={`object-cover transition-opacity duration-700 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${isInteractive ? "cursor-pointer" : ""}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={90}
        priority={false}
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

export default MemoryImage;
