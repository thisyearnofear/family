import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import {
  ArrowDownToLine,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeft,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { variants } from "@utils/animations";
import { downloadPhoto, range } from "@utils/helpers";
import type { ImageProps, SharedModalProps } from "@utils/types";

// Helper function to get full IPFS URL
const getIpfsUrl = (image: ImageProps) => {
  return `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`;
};

export default function SharedModal({
  index,
  images = [],
  changePhotoId,
  closeModal,
  navigation,
  currentPhoto,
  direction,
}: SharedModalProps) {
  const [loaded, setLoaded] = useState(false);

  const filteredImages =
    images?.filter((img: ImageProps) =>
      range(index - 15, index + 15).includes(img.id)
    ) || [];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (index < images.length - 1) {
        changePhotoId(index + 1);
      }
    },
    onSwipedRight: () => {
      if (index > 0) {
        changePhotoId(index - 1);
      }
    },
    trackMouse: true,
  });

  const currentImage = images[index] || currentPhoto;

  const handleDownload = () => {
    if (!currentImage) return;
    const url = getIpfsUrl(currentImage);
    const filename = currentImage.dateTaken
      ? `memory-${
          new Date(currentImage.dateTaken).toISOString().split("T")[0]
        }.jpg`
      : `memory-${currentImage.ipfsHash.slice(0, 8)}.jpg`;
    downloadPhoto(url, filename);
  };

  if (!currentImage) {
    return null;
  }

  return (
    <MotionConfig
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      <div className="relative z-50 flex aspect-[3/2] w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto">
        {/* Main image */}
        <div className="w-full overflow-hidden">
          <div className="relative flex aspect-[2/5] items-center justify-center md:aspect-[3/2]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute"
              >
                <Image
                  src={getIpfsUrl(currentImage)}
                  width={navigation ? 1280 : 1920}
                  height={navigation ? 853 : 1280}
                  priority
                  alt={currentImage.name || "Gallery image"}
                  onLoad={() => setLoaded(true)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons + bottom nav bar */}
        {loaded && (
          <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center">
            {/* Navigation buttons */}
            {navigation && (
              <>
                {index > 0 && (
                  <button
                    className="absolute left-3 top-[calc(50%-16px)] rounded-full bg-black/20 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/55 hover:text-white focus:outline-none"
                    onClick={() => changePhotoId(index - 1)}
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                )}
                {index + 1 < images.length && (
                  <button
                    className="absolute right-3 top-[calc(50%-16px)] rounded-full bg-black/20 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/55 hover:text-white focus:outline-none"
                    onClick={() => changePhotoId(index + 1)}
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            )}

            {/* Action buttons */}
            <div className="absolute right-0 top-0 flex items-center gap-2 p-3 text-white">
              <button
                onClick={handleDownload}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-lg transition hover:bg-black/75"
                title="Download photo"
              >
                <ArrowDownToLine className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute left-0 top-0 flex items-center gap-2 p-3 text-white">
              <button
                onClick={closeModal}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-lg transition hover:bg-black/75"
              >
                {navigation ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Bottom thumbnail navigation */}
            {navigation && filteredImages.length > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-40 hidden overflow-hidden bg-gradient-to-b from-black/0 to-black/60 md:flex">
                <motion.div
                  initial={false}
                  className="mx-auto mb-6 mt-6 flex aspect-[3/2] h-14"
                >
                  <AnimatePresence initial={false}>
                    {filteredImages.map((image) => (
                      <motion.button
                        initial={{
                          width: "0%",
                          x: `${Math.max((index - 1) * -100, 15 * -100)}%`,
                        }}
                        animate={{
                          scale: image.id === index ? 1.25 : 1,
                          width: "100%",
                          x: `${Math.max(index * -100, 15 * -100)}%`,
                        }}
                        exit={{ width: "0%" }}
                        onClick={() => changePhotoId(image.id)}
                        key={image.id}
                        className={`${
                          image.id === index
                            ? "z-20 rounded-md shadow shadow-black/50"
                            : "z-10"
                        } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                      >
                        <Image
                          alt="Gallery thumbnail"
                          width={180}
                          height={120}
                          className={`${
                            image.id === index
                              ? "brightness-110"
                              : "brightness-50 contrast-125 hover:brightness-75"
                          } h-full transform object-cover transition`}
                          src={getIpfsUrl(image)}
                        />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
