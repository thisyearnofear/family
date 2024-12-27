import Image from "next/image";
import { useState } from "react";
import type { ImageProps } from "../utils/types";

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
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
  const imageUrl = `${gateway}/ipfs/${image.ipfsHash}`;

  return (
    <Image
      src={imageUrl}
      alt={image.name || "A cherished memory"}
      className={className}
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
    />
  );
};

export default MemoryImage;
