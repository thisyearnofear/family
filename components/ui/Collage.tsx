import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { ImageProps } from "../../utils/types/types";

interface CollageProps {
  images: ImageProps[];
  theme?: "space" | "japanese";
}

const Collage: React.FC<CollageProps> = ({ images, theme = "space" }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {images.map((image, index) => (
        <motion.div
          key={image.ipfsHash}
          variants={itemVariants}
          className={`relative aspect-[3/2] group ${
            theme === "space"
              ? "rounded-lg overflow-hidden border-2 border-blue-500/30"
              : "rounded overflow-hidden"
          }`}
        >
          {theme === "japanese" && (
            <>
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded transform -rotate-1" />
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded transform rotate-1" />
            </>
          )}
          <div
            className={`relative w-full h-full ${
              theme === "japanese" ? "border border-white/20" : ""
            }`}
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
              alt={image.dateTaken || "Memory"}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                theme === "space" ? "rounded-lg" : ""
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div
              className={`absolute inset-0 ${
                theme === "space"
                  ? "bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100"
                  : "bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100"
              } transition-opacity duration-300`}
            />
            <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p
                className={`text-sm ${
                  theme === "japanese" ? "font-japanese" : "font-bold"
                }`}
              >
                {new Date(image.dateTaken || "").toLocaleDateString(
                  theme === "japanese" ? "ja-JP" : "en-US",
                  theme === "japanese"
                    ? undefined
                    : {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                )}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Collage;
