import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import MemoryImage from "../media/MemoryImage";
import type { ImageProps } from "../../utils/types/types";
import CreateGiftFlow from "../ui/CreateGiftFlow";
import PhotoViewer from "../media/PhotoViewer";
import TimelineControls from "./TimelineControls";
import {
  ChevronLeftIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface MonthlyViewProps {
  images: ImageProps[];
  currentIndex: number;
  onImageClick?: (index: number) => void;
  theme?: "space" | "japanese";
  loadingStates?: LoadingState;
  setLoadingStates?: React.Dispatch<React.SetStateAction<LoadingState>>;
  isAutoHighlighting: boolean;
  isGalleryStage?: boolean;
  title?: string;
}

interface MonthData {
  key: string;
  month: string;
  images: ImageProps[];
  startIndex: number;
}

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    loadedCount: number;
    totalCount: number;
  };
}

// Simplify to be a pure presentational component
const MonthlyView = React.memo<MonthlyViewProps>(
  ({
    images,
    currentIndex,
    onImageClick,
    theme = "japanese",
    loadingStates = {},
    setLoadingStates = () => {},
    isAutoHighlighting,
    isGalleryStage,
    title,
  }) => {
    const router = useRouter();
    const [showCreateGift, setShowCreateGift] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageProps | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [highlightedImage, setHighlightedImage] = useState<ImageProps | null>(
      null
    );
    const [currentHighlightedImage, setCurrentHighlightedImage] =
      useState<ImageProps | null>(null);

    // Initialize loading state only once
    useEffect(() => {
      if (!loadingStates["final-collage"]) {
        setLoadingStates((prev) => ({
          ...prev,
          "final-collage": {
            isLoading: true,
            loadedCount: 0,
            totalCount: images.length,
          },
        }));
      }
    }, [images.length, loadingStates, setLoadingStates]);

    // Group images by month
    const monthlyData = useMemo(() => {
      const months: MonthData[] = [];
      let currentStartIndex = 0;

      const sortedImages = [...images].sort((a, b) => {
        if (!a.dateTaken || !b.dateTaken) return 0;
        return (
          new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime()
        );
      });

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
          lastMonth.images.push(image);
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

      // Add gallery as final stage
      months.push({
        key: "gallery",
        month: "Gallery",
        images: sortedImages,
        startIndex: currentStartIndex,
      });

      return months;
    }, [images]);

    // Find current month based on currentIndex
    const { currentMonth, currentMonthIndex } = useMemo(() => {
      const monthIndex = monthlyData.findIndex(
        (month) =>
          currentIndex >= month.startIndex &&
          currentIndex < month.startIndex + month.images.length
      );
      return {
        currentMonth: monthIndex >= 0 ? monthlyData[monthIndex] : null,
        currentMonthIndex: monthIndex,
      };
    }, [monthlyData, currentIndex]);

    // Add useCallback for handleImageLoad
    const handleImageLoad = useCallback(
      (key: string, index: number, total: number) => {
        setLoadingStates((prev) => {
          const currentState = prev[key] || {
            isLoading: true,
            loadedCount: 0,
            totalCount: total,
          };

          const newLoadedCount = currentState.loadedCount + 1;
          const isLoading = newLoadedCount < total;

          return {
            ...prev,
            [key]: {
              isLoading,
              loadedCount: newLoadedCount,
              totalCount: total,
            },
          };
        });
      },
      [setLoadingStates]
    );

    // Simplified image click handler
    const handleImageClick = useCallback((image: ImageProps) => {
      setHighlightedImage(image);
    }, []);

    // Update effect to handle auto-highlighting image display
    useEffect(() => {
      if (isAutoHighlighting && currentMonth) {
        const currentImageIndex = currentIndex - currentMonth.startIndex;
        if (
          currentImageIndex >= 0 &&
          currentImageIndex < currentMonth.images.length
        ) {
          setCurrentHighlightedImage(currentMonth.images[currentImageIndex]);
        }
      } else {
        setCurrentHighlightedImage(null);
      }
    }, [isAutoHighlighting, currentMonth, currentIndex]);

    // Memoize the monthly collage rendering
    const monthlyCollage = useMemo(() => {
      if (!currentMonth) return null;

      return (
        <div
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
            currentHighlightedImage ? "opacity-50" : ""
          }`}
        >
          {currentMonth.images.map((image, index) => {
            // Calculate if this image should be highlighted
            const isCurrentImage =
              currentIndex === currentMonth.startIndex + index;
            const isHighlighted =
              focusedIndex === index || (isAutoHighlighting && isCurrentImage);

            return (
              <motion.div
                key={image.ipfsHash}
                className="relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (!isAutoHighlighting) {
                    handleImageClick(image);
                  }
                  onImageClick?.(currentMonth.startIndex + index);
                }}
                onHoverStart={() =>
                  !isAutoHighlighting && setFocusedIndex(index)
                }
                onHoverEnd={() => !isAutoHighlighting && setFocusedIndex(null)}
              >
                <motion.div
                  className="w-full h-full"
                  animate={{ scale: isHighlighted ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MemoryImage
                    image={image}
                    isInteractive
                    className="rounded-lg transition-all duration-300"
                    onLoad={() =>
                      handleImageLoad(
                        currentMonth.key,
                        index,
                        currentMonth.images.length
                      )
                    }
                  />
                </motion.div>
                {isHighlighted && !currentHighlightedImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                  >
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      {theme === "japanese"
                        ? `思い出 ${index + 1}`
                        : `Memory ${index + 1}`}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      );
    }, [
      currentMonth,
      handleImageClick,
      onImageClick,
      focusedIndex,
      isAutoHighlighting,
      currentIndex,
      theme,
      currentHighlightedImage,
      handleImageLoad,
    ]);

    // Add auto-highlighting overlay
    const autoHighlightOverlay = useMemo(() => {
      if (!currentHighlightedImage) return null;

      return (
        <motion.div
          key="auto-highlight-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-none"
        >
          <motion.div
            className="relative w-full max-w-5xl h-[80vh]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MemoryImage
              image={currentHighlightedImage}
              className="rounded-lg shadow-2xl"
            />
          </motion.div>
        </motion.div>
      );
    }, [currentHighlightedImage]);

    // Add useCallback for handling home navigation
    const handleHomeClick = useCallback(() => {
      const confirmed = window.confirm(
        "Are you sure you want to return to the home page? You will need to input your gift ID again to reload this experience."
      );
      if (confirmed) {
        // Navigate to home page and reload to ensure clean state
        window.location.href = "/";
      }
    }, []);

    // Render gallery view
    if (isGalleryStage) {
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

      // Check if all images are loaded
      const isLoading = Object.values(loadingStates).some(
        (state) => state.isLoading || state.loadedCount < state.totalCount
      );

      return (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex flex-col items-center"
          >
            {/* Fixed header with title and buttons */}
            <div className={`w-full max-w-6xl mx-auto p-8`}>
              <div
                className={`${bgClass} backdrop-blur-sm rounded-2xl p-8 border flex flex-col items-center gap-6`}
              >
                <h2
                  className={`text-4xl font-bold text-center ${
                    isSpace ? textClass : "font-japanese"
                  }`}
                >
                  {isSpace ? (
                    title || "A Year in Memories"
                  ) : (
                    <>
                      思い出の一年
                      <span className="block text-lg mt-2 text-stone-600">
                        {title || "A Year in Memories"}
                      </span>
                    </>
                  )}
                </h2>
                <div className="flex flex-row items-center justify-center gap-4 w-full max-w-lg">
                  <button
                    onClick={() => {
                      if (onImageClick) {
                        onImageClick(0); // Go back to first image
                      }
                    }}
                    className={`px-6 py-3 rounded-lg text-white transition-all ${
                      isSpace
                        ? "bg-blue-600/70 hover:bg-blue-700/70"
                        : "bg-red-600/70 hover:bg-red-700/70"
                    } border border-opacity-30 hover:scale-105 w-full sm:w-auto`}
                  >
                    Restart
                  </button>
                  <button
                    onClick={handleHomeClick}
                    className={`px-6 py-3 rounded-lg text-white transition-all ${
                      isSpace
                        ? "bg-purple-600/70 hover:bg-purple-700/70"
                        : "bg-amber-600/70 hover:bg-amber-700/70"
                    } border border-opacity-30 hover:scale-105 w-full sm:w-auto`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setShowCreateGift(true)}
                    className={`px-6 py-3 rounded-lg text-white transition-all ${
                      isSpace
                        ? "bg-emerald-600/70 hover:bg-emerald-700/70"
                        : "bg-teal-600/70 hover:bg-teal-700/70"
                    } border border-opacity-30 hover:scale-105 w-full sm:w-auto`}
                  >
                    Create Gift
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable photo grid */}
            <div className="w-full max-w-6xl flex-1 overflow-y-auto px-8 pb-8">
              <div
                className={`${bgClass} backdrop-blur-sm rounded-2xl border h-full overflow-y-auto`}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8">
                  {images.map((image, idx) => (
                    <motion.div
                      key={image.ipfsHash}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative aspect-square cursor-pointer group"
                      onClick={() => {
                        setHighlightedImage(image);
                      }}
                    >
                      <MemoryImage
                        image={image}
                        isInteractive
                        className="rounded-lg shadow-md transition-transform group-hover:scale-105"
                        onLoad={() =>
                          handleImageLoad("final-collage", idx, images.length)
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4" />
                  <p className={textClass}>Loading your memories...</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Create Gift Flow */}
          <AnimatePresence>
            {showCreateGift && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
              >
                <CreateGiftFlow
                  onClose={() => setShowCreateGift(false)}
                  onComplete={async () => {
                    setShowCreateGift(false);
                    router.push("/");
                  }}
                  onGiftCreated={(giftId) => {
                    console.log("Gift created:", giftId);
                    setShowCreateGift(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Highlighted Image Overlay */}
          <AnimatePresence>
            {highlightedImage && (
              <motion.div
                key="highlighted-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setHighlightedImage(null)}
              >
                <motion.div
                  className="relative w-full max-w-5xl h-[80vh]"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                >
                  <MemoryImage
                    image={highlightedImage}
                    className="rounded-lg shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );
    }

    // Render loading state
    if (!currentMonth) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      );
    }

    // Render monthly view
    return (
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <motion.div
          className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
        >
          <motion.h2
            layoutId={`month-title-${currentMonth?.month}`}
            className="text-3xl font-bold text-white text-center"
          >
            {currentMonth?.month}
          </motion.h2>
        </motion.div>

        {/* Images - Make this scrollable */}
        <motion.div
          className="fixed inset-0 pt-24 pb-20 px-4 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="max-w-6xl mx-auto">{monthlyCollage}</div>
        </motion.div>

        {/* Auto-highlighting Overlay */}
        <AnimatePresence>{autoHighlightOverlay}</AnimatePresence>

        {/* Manual Highlight Image Overlay */}
        <AnimatePresence>
          {!isAutoHighlighting && highlightedImage && (
            <motion.div
              key="highlighted-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setHighlightedImage(null)}
            >
              <motion.div
                className="relative w-full max-w-5xl h-[80vh]"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <MemoryImage
                  image={highlightedImage}
                  className="rounded-lg shadow-2xl"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

MonthlyView.displayName = "MonthlyView";

export default MonthlyView;
