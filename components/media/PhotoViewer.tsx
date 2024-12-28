import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ImageProps } from "../../utils/types/types";

interface PhotoViewerProps {
  image: ImageProps;
  onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ image, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.name || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading photo:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowDownTrayIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
          alt={image.name || "Photo"}
          fill
          className="object-contain"
          onLoadingComplete={() => setIsLoading(false)}
          priority
        />
      </div>
    </motion.div>
  );
};

export default PhotoViewer;
