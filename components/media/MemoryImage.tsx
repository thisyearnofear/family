import Image from "next/image";
import { motion } from "framer-motion";
import type { ImageProps } from "../../utils/types/types";

interface MemoryImageProps {
  image: ImageProps;
  className?: string;
  isInteractive?: boolean;
  priority?: boolean;
  onLoad?: () => void;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  className = "",
  isInteractive = false,
  priority = false,
  onLoad,
}) => {
  const gateway = "https://gateway.pinata.cloud/ipfs";
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${gateway}/${image.ipfsHash}`;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageUrl}
        alt={image.description || "Memory"}
        className={`object-cover ${
          isInteractive ? "transition-transform duration-300" : ""
        }`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={75}
        priority={priority}
        onLoad={onLoad}
      />
    </div>
  );
};

export default MemoryImage;
