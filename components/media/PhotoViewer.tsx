import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { ImageProps } from "../../utils/types/types";

interface PhotoViewerProps {
  image: ImageProps | null;
  onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ image, onClose }) => {
  if (!image) return null;

  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
    "https://gateway.pinata.cloud/ipfs";
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${gateway}/${image.ipfsHash}`;

  return (
    <Dialog
      static
      open={true}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-5xl h-[80vh] m-4"
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={image.description || "Memory"}
            className="object-contain rounded-lg"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
            quality={90}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </motion.div>
    </Dialog>
  );
};

export default PhotoViewer;
