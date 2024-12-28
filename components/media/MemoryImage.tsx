import Image from "next/image";
import { useState } from "react";
import type { ImageProps } from "../../utils/types/types";

interface MemoryImageProps {
  image: ImageProps;
  isInteractive?: boolean;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  isInteractive = false,
  className = "",
  priority = false,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Construct the full URL for the image
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `https://gateway.pinata.cloud/ipfs/${image.ipfsHash}`;

  // In production, use a regular img tag to bypass Next.js image optimization
  if (process.env.NODE_ENV === "production") {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <img
          src={imageUrl}
          alt={`Image taken on ${image.dateTaken || "unknown date"}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isLoading || isError ? "opacity-0" : "opacity-100"
          } ${isInteractive ? "cursor-pointer" : ""}`}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={() => {
            console.error("Failed to load image:", imageUrl);
            setIsError(true);
            setIsLoading(false);
          }}
        />
        {(isLoading || isError) && (
          <div
            className={`absolute inset-0 ${
              isError ? "bg-red-100" : "bg-gray-100"
            } animate-pulse flex items-center justify-center`}
          >
            {isError && (
              <span className="text-red-500 text-sm">Failed to load image</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // In development, use Next.js Image component
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageUrl}
        alt={`Image taken on ${image.dateTaken || "unknown date"}`}
        className={`object-cover transition-opacity duration-700 ${
          isLoading || isError ? "opacity-0" : "opacity-100"
        } ${isInteractive ? "cursor-pointer" : ""}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={90}
        priority={priority}
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          console.error("Failed to load image:", imageUrl);
          setIsError(true);
          setIsLoading(false);
        }}
      />
      {(isLoading || isError) && (
        <div
          className={`absolute inset-0 ${
            isError ? "bg-red-100" : "bg-gray-100"
          } animate-pulse flex items-center justify-center`}
        >
          {isError && (
            <span className="text-red-500 text-sm">Failed to load image</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryImage;
