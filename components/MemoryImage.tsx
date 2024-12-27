import Image from "next/image";
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
  return (
    <Image
      src={`https://gateway.pinata.cloud/ipfs/${image.ipfsHash}`}
      alt={image.name || "A cherished memory"}
      className={className}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        objectFit: isInteractive ? "cover" : "contain",
      }}
      priority={true}
      onLoad={onLoad}
    />
  );
};

export default MemoryImage;
