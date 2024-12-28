import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import type { ImageProps } from "../../utils/types/types";

interface MonthlyCollageProps {
  month: string;
  images: ImageProps[];
  theme?: "space" | "japanese";
  onImageClick?: (image: ImageProps) => void;
}

const MonthlyCollage: React.FC<MonthlyCollageProps> = ({
  month,
  images,
  theme = "japanese",
  onImageClick,
}) => {
  // Get layout configuration based on number of images
  const layoutConfig = useMemo(() => {
    const count = images.length;
    switch (count) {
      case 1:
        return [["full"]];
      case 2:
        return [["half", "half"]];
      case 3:
        return [["full"], ["half", "half"]];
      case 4:
        return [
          ["half", "half"],
          ["half", "half"],
        ];
      case 5:
        return [["full"], ["third", "third", "third"]];
      case 6:
        return [
          ["third", "third", "third"],
          ["third", "third", "third"],
        ];
      case 7:
        return [["full"], ["quarter", "quarter", "quarter", "quarter"]];
      case 8:
        return [
          ["half", "half"],
          ["quarter", "quarter", "quarter", "quarter"],
        ];
      case 9:
        return [
          ["third", "third", "third"],
          ["third", "third", "third"],
          ["third", "third", "third"],
        ];
      case 10:
        return [
          ["half", "half"],
          ["third", "third", "third"],
          ["quarter", "quarter", "quarter", "quarter"],
        ];
      default:
        return [["full"]];
    }
  }, [images.length]);

  // Get size classes based on layout type
  const getSizeClasses = (type: string) => {
    switch (type) {
      case "full":
        return "col-span-4 aspect-[16/9]";
      case "half":
        return "col-span-2 aspect-square";
      case "third":
        return "col-span-2 md:col-span-1 aspect-square";
      case "quarter":
        return "col-span-1 aspect-square";
      default:
        return "col-span-4 aspect-[16/9]";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-7xl mx-auto p-4"
    >
      <h3
        className={`text-2xl mb-6 ${
          theme === "japanese"
            ? "font-japanese text-stone-800"
            : "font-bold text-blue-400"
        }`}
      >
        {month}
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {layoutConfig.map((row, rowIndex) =>
          row.map((size, colIndex) => {
            const imageIndex = rowIndex * row.length + colIndex;
            const image = images[imageIndex];
            if (!image) return null;

            return (
              <motion.div
                key={image.ipfsHash}
                className={`relative overflow-hidden rounded-lg ${getSizeClasses(
                  size
                )} 
                  ${
                    theme === "japanese"
                      ? "border border-stone-200 bg-white/50"
                      : "border border-blue-500/30 bg-black/50"
                  }`}
                whileHover={{ scale: 1.02 }}
                onClick={() => onImageClick?.(image)}
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
                  alt={image.dateTaken || "Memory"}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default MonthlyCollage;
