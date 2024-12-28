import CustomImage from "../ui/CustomImage";
import { motion } from "framer-motion";
import { ImageProps } from "../../utils/types/types";

interface PhotoViewerProps {
  image: ImageProps;
  priority?: boolean;
  onLoad?: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  image,
  priority = false,
  onLoad,
}) => {
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full"
    >
      <CustomImage
        src={imageUrl}
        alt={image.description || "Photo memory"}
        className="object-cover w-full h-full"
        priority={priority}
        onLoad={onLoad}
      />
    </motion.div>
  );
};

export default PhotoViewer;
