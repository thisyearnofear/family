import Image from "next/image";
import { useState } from "react";
import type { ImageProps } from "../../utils/types/types";

interface MemoryImageProps {
  image: ImageProps;
  className?: string;
  isInteractive?: boolean;
  onLoad?: () => void;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  className = "",
  isInteractive = false,
  onLoad,
}) => {
  const [error, setError] = useState(false);

  // Fallback to default gateway if environment variable is not set
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
    "https://gateway.pinata.cloud/ipfs";
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${gateway}/${image.ipfsHash}`;

  if (error) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center w-full h-full min-h-[200px]`}
      >
        <span className="text-gray-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[200px] ${className}`}>
      <Image
        src={imageUrl}
        alt={image.name || "A cherished memory"}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{
          objectFit: isInteractive ? "cover" : "contain",
        }}
        priority={true}
        onLoad={onLoad}
        onError={() => {
          console.error(`Failed to load image: ${imageUrl}`);
          setError(true);
        }}
        placeholder={image.blurDataUrl ? "blur" : "empty"}
        blurDataURL={image.blurDataUrl}
      />
    </div>
  );
};

export default MemoryImage;
