import { motion } from "framer-motion";
import { ImageProps } from "../../utils/types/types";
import MemoryImage from "../media/MemoryImage";

interface MonthlyCollageProps {
  images: ImageProps[];
  onImageClick?: (index: number) => void;
}

const MonthlyCollage: React.FC<MonthlyCollageProps> = ({
  images,
  onImageClick,
}) => {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {images.map((image, index) => (
        <motion.div
          key={image.ipfsHash}
          className="relative aspect-square rounded-lg overflow-hidden shadow-lg"
          whileHover={{ scale: 1.05 }}
          onClick={() => onImageClick?.(index)}
        >
          <MemoryImage image={image} isInteractive className="rounded-lg" />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MonthlyCollage;
