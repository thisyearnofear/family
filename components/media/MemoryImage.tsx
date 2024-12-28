import CustomImage from "../ui/CustomImage";
import { motion } from "framer-motion";
import { ImageProps } from "../../utils/types/types";

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
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative w-full h-full ${
        isInteractive ? "cursor-pointer" : ""
      }`}
    >
      <CustomImage
        src={imageUrl}
        alt={image.description || "Memory"}
        className={`object-cover w-full h-full ${className}`}
        priority={priority}
        onLoad={onLoad}
      />
    </motion.div>
  );
};

export default MemoryImage;
