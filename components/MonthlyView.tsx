import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import MemoryImage from "./MemoryImage";
import type { ImageProps } from "../utils/types";
import CreateGiftFlow from "./CreateGiftFlow";

interface MonthlyViewProps {
  images: ImageProps[];
  currentIndex: number;
  onImageClick?: (index: number) => void;
  theme?: "space" | "japanese";
}

interface MonthData {
  key: string;
  month: string;
  images: ImageProps[];
  startIndex: number;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({
  images,
  currentIndex,
  onImageClick,
  theme = "japanese",
}) => {
  const router = useRouter();
  const [showCreateGift, setShowCreateGift] = useState(false);

  // Group images by month
  const monthlyData = useMemo(() => {
    const months: MonthData[] = [];
    let currentStartIndex = 0;

    // Sort images by date
    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateTaken || !b.dateTaken) return 0;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
    });

    // Group by month
    sortedImages.forEach((image) => {
      if (!image.dateTaken) return;

      const date = new Date(image.dateTaken);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const lastMonth = months[months.length - 1];
      if (lastMonth && lastMonth.key === monthKey) {
        if (lastMonth.images.length < 10) {
          // Limit to 10 images per month
          lastMonth.images.push(image);
        }
      } else {
        months.push({
          key: monthKey,
          month: monthName,
          images: [image],
          startIndex: currentStartIndex,
        });
      }
      currentStartIndex++;
    });

    return months;
  }, [images]);

  // Find current month
  const currentMonth = monthlyData.find(
    (month) =>
      currentIndex >= month.startIndex &&
      currentIndex < month.startIndex + month.images.length
  );

  // Check if we're at the end
  const isLastImage = currentIndex === images.length - 1;

  // Render final collage
  if (isLastImage) {
    const isSpace = theme === "space";
    const bgClass = isSpace
      ? "bg-black/50 border-blue-500/30"
      : "bg-white/50 border-stone-500/30";
    const textClass = isSpace ? "text-white" : "text-stone-800";
    const buttonBgClass = isSpace
      ? "bg-blue-600/70 hover:bg-blue-700/70"
      : "bg-red-600/70 hover:bg-red-700/70";
    const altButtonBgClass = isSpace
      ? "bg-black/70 hover:bg-blue-900/70"
      : "bg-stone-800/70 hover:bg-stone-700/70";

    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 flex flex-col items-center p-8"
        >
          <div className={`w-full max-w-6xl mx-auto flex flex-col h-full`}>
            {/* Fixed header */}
            <div
              className={`${bgClass} backdrop-blur-sm rounded-t-2xl p-8 border border-b-0`}
            >
              <h2
                className={`text-4xl font-bold text-center ${
                  isSpace ? textClass : "font-japanese"
                }`}
              >
                {isSpace ? (
                  "Your Year in Photos"
                ) : (
                  <>
                    思い出の一年
                    <span className="block text-lg mt-2 text-stone-600">
                      A Year of Memories
                    </span>
                  </>
                )}
              </h2>
            </div>

            {/* Scrollable photo grid */}
            <div
              className={`${bgClass} backdrop-blur-sm flex-1 overflow-y-auto border border-y-0`}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8 pb-32">
                {images.map((image, idx) => (
                  <div
                    key={image.ipfsHash}
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => onImageClick?.(idx)}
                  >
                    <MemoryImage
                      image={image}
                      isInteractive
                      className="rounded-lg shadow-md transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed footer with buttons */}
            <div
              className={`${bgClass} backdrop-blur-sm rounded-b-2xl p-8 border border-t-0`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push("/")}
                  className={`px-6 py-3 rounded-lg text-white transition-all ${altButtonBgClass} border border-opacity-30 hover:scale-105 w-full sm:w-auto`}
                >
                  Start Over
                </button>
                <button
                  onClick={() => setShowCreateGift(true)}
                  className={`px-6 py-3 rounded-lg text-white transition-all ${buttonBgClass} border border-opacity-30 hover:scale-105 w-full sm:w-auto`}
                >
                  Create Your Own Gift
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCreateGift && (
            <CreateGiftFlow
              onClose={() => setShowCreateGift(false)}
              onComplete={async (data) => {
                // TODO: Handle the creation of a new gift
                console.log("Creating new gift with:", data);
                setShowCreateGift(false);
                // Navigate to the new gift when ready
                // router.push(`/p/${newGiftId}`);
              }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Render single image if month has only one image
  if (currentMonth && currentMonth.images.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-4xl aspect-[3/2]">
          <MemoryImage
            image={currentMonth.images[0]}
            className="rounded-lg shadow-xl"
          />
        </div>
      </motion.div>
    );
  }

  // Render month collage
  return (
    <AnimatePresence mode="wait">
      {currentMonth && (
        <motion.div
          key={currentMonth.key}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full h-full flex flex-col items-center justify-center p-4 gap-4"
        >
          <h2
            className={`text-2xl ${
              theme === "space" ? "text-white" : "font-japanese text-stone-800"
            }`}
          >
            {currentMonth.month}
          </h2>
          <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {currentMonth.images.map((image, idx) => (
              <div
                key={image.ipfsHash}
                className="relative aspect-square cursor-pointer"
                onClick={() => onImageClick?.(currentMonth.startIndex + idx)}
              >
                <MemoryImage
                  image={image}
                  isInteractive
                  className="rounded-lg shadow-md"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MonthlyView;
