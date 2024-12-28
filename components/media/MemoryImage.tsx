import Image from "next/image";
import { motion } from "framer-motion";
import type { ImageProps } from "../../utils/types/types";
import dynamic from "next/dynamic";

// Dynamically import DevImage only in development
const DevImage = dynamic(
  () => import("./DevImage").then((mod) => mod.default),
  { ssr: false }
);

interface MemoryImageProps {
  image: ImageProps;
  priority?: boolean;
  onLoad?: () => void;
  className?: string;
  isInteractive?: boolean;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  priority = false,
  onLoad,
  className = "",
  isInteractive = false,
}) => {
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
    "https://gateway.pinata.cloud/ipfs";
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${gateway}/${image.ipfsHash}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <motion.div
        className={`relative w-full h-full overflow-hidden ${
          isInteractive ? "cursor-pointer" : ""
        }`}
        whileHover={
          isInteractive
            ? {
                scale: 1.05,
                transition: { duration: 0.2 },
              }
            : undefined
        }
      >
        <DevImage
          src={imageUrl}
          alt={image.description || "Memory"}
          className={`object-cover ${className}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          quality={75}
          onLoad={onLoad}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative w-full h-full overflow-hidden ${
        isInteractive ? "cursor-pointer" : ""
      }`}
      whileHover={
        isInteractive
          ? {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
          : undefined
      }
    >
      <Image
        src={imageUrl}
        alt={image.description || "Memory"}
        className={`object-cover ${className}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        quality={75}
        onLoad={onLoad}
      />
    </motion.div>
  );
};

export default MemoryImage;
