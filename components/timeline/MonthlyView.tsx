import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import MemoryImage from "../media/MemoryImage";
import type { ImageProps } from "../../utils/types/types";
import CreateGiftFlow from "../ui/CreateGiftFlow";
import PhotoViewer from "../media/PhotoViewer";
import TimelineControls from "./TimelineControls";

interface MonthlyViewProps {
  images: ImageProps[];
  currentIndex: number;
  onImageClick?: (index: number) => void;
  theme?: "space" | "japanese";
  loadingStates?: LoadingState;
  setLoadingStates?: React.Dispatch<React.SetStateAction<LoadingState>>;
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

const HIGHLIGHT_DURATION = 4000; // 4 seconds per photo for better viewing
const TRANSITION_DURATION = 0.6; // 0.6 seconds for smoother transitions
const MONTH_TRANSITION_DURATION = 0.8; // 0.8 seconds for month transitions
const HIGHLIGHT_INTERVAL = 4000; // 4 seconds per photo highlight

const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
];

const MonthlyView: React.FC<MonthlyViewProps> = ({
  images,
  currentIndex,
  onImageClick,
  theme = "japanese",
  loadingStates = {},
  setLoadingStates = () => {},
}) => {
  console.log("MonthlyView Component Mounted");
  console.log("Initial Props:", {
    imagesCount: images?.length,
    currentIndex,
    theme,
    loadingStatesKeys: Object.keys(loadingStates),
  });

  const router = useRouter();
  const [showCreateGift, setShowCreateGift] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageProps | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [highlightedImage, setHighlightedImage] = useState<ImageProps | null>(
    null
  );
  const [autoHighlightIndex, setAutoHighlightIndex] = useState<number | null>(
    null
  );
  const [isAutoHighlighting, setIsAutoHighlighting] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [hasCompletedFirstView, setHasCompletedFirstView] = useState(false);

  // Initialize loading state for final collage
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
  }, [loadingStates, images.length, setLoadingStates]);

  // Add error boundary
  useEffect(() => {
    try {
      console.log("Initial Mount Effect Running");

      // Log environment variables immediately
      console.log("Early Environment Check:", {
        gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
        groupId: process.env.NEXT_PUBLIC_PINATA_GROUP_ID,
        nodeEnv: process.env.NODE_ENV,
      });

      // Test image URL construction
      if (images?.[0]?.ipfsHash) {
        const gateway =
          process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
          "https://gateway.pinata.cloud/ipfs";
        const testUrl = `${gateway}/${images[0].ipfsHash}`;
        console.log("Test Image URL:", testUrl);
      }
    } catch (error) {
      console.error("Error in initial mount:", error);
    }
  }, [images]);

  // Add image cache with error handling
  const imageCache = useMemo(() => {
    console.log("Creating Image Cache");
    try {
      const cache = new Map<string, HTMLImageElement>();

      const preloadImage = (image: ImageProps) => {
        try {
          if (cache.has(image.ipfsHash)) return;

          const img = new Image();
          const gateway =
            process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
            "https://gateway.pinata.cloud/ipfs";
          const imageUrl = image.ipfsHash.startsWith("http")
            ? image.ipfsHash
            : `${gateway}/${image.ipfsHash}`;

          img.src = imageUrl;
          cache.set(image.ipfsHash, img);
        } catch (error) {
          console.error("Error in preloadImage:", error);
        }
      };

      return {
        get: (hash: string) => cache.get(hash),
        preload: preloadImage,
        has: (hash: string) => cache.has(hash),
      };
    } catch (error) {
      console.error("Error creating imageCache:", error);
      return {
        get: () => null,
        preload: () => {},
        has: () => false,
      };
    }
  }, []);

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

    // Add the gallery as the final month
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
        (month.key === "gallery" ||
          currentIndex < month.startIndex + month.images.length)
    );
    return {
      currentMonth: monthIndex >= 0 ? monthlyData[monthIndex] : null,
      currentMonthIndex: monthIndex,
    };
  }, [monthlyData, currentIndex]);

  const handleImageLoad = (monthKey: string, index: number, total: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      [monthKey]: {
        isLoading: (prev[monthKey]?.loadedCount || 0) + 1 < total,
        loadedCount: (prev[monthKey]?.loadedCount || 0) + 1,
        totalCount: total,
      },
    }));
  };

  // Auto highlight timer
  useEffect(() => {
    if (!currentMonth || !isAutoHighlighting) return;

    const timer = setInterval(() => {
      setAutoHighlightIndex((prev) => {
        if (prev === null || prev >= currentMonth.images.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, HIGHLIGHT_INTERVAL);

    return () => clearInterval(timer);
  }, [currentMonth, isAutoHighlighting]);

  // Update highlighted image when auto highlight index changes
  useEffect(() => {
    if (autoHighlightIndex !== null && currentMonth) {
      setHighlightedImage(currentMonth.images[autoHighlightIndex]);
    }
  }, [autoHighlightIndex, currentMonth]);

  // Reset auto highlight when month changes
  useEffect(() => {
    setAutoHighlightIndex(0);
    setIsAutoHighlighting(true);
  }, [currentMonth?.key]);

  // Stop auto highlighting when user interacts
  const handleImageClick = (image: ImageProps) => {
    setIsAutoHighlighting(false);
    setHighlightedImage(image);
  };

  // Calculate if we should show the gallery
  const shouldShowGallery = useMemo(() => {
    const lastMonth = monthlyData[monthlyData.length - 2]; // -2 because -1 is the gallery
    if (!lastMonth) return false;

    // Ensure the currentIndex is beyond the last month's images
    return (
      currentIndex >= lastMonth.startIndex + lastMonth.images.length ||
      currentMonth?.key === "gallery"
    );
  }, [monthlyData, currentIndex, currentMonth]);

  // Adjust navigation logic to allow transition to gallery
  const handleNextMonth = useCallback(() => {
    const nextMonthIndex = currentMonthIndex + 1;
    if (nextMonthIndex < monthlyData.length) {
      onImageClick?.(monthlyData[nextMonthIndex].startIndex);
    } else if (nextMonthIndex === monthlyData.length) {
      // Transition to gallery
      onImageClick?.(monthlyData[nextMonthIndex - 1].startIndex);
    }
  }, [currentMonthIndex, monthlyData, onImageClick]);

  // Render timeline controls with highlight toggle
  const renderTimelineControls = () => {
    if (!currentMonth) return null;

    const isSpace = theme === "space";
    const buttonClass = isSpace
      ? "bg-blue-600/70 hover:bg-blue-700/70"
      : "bg-red-600/70 hover:bg-red-700/70";

    return (
      <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => {
              const prevMonthIndex = currentMonthIndex - 1;
              if (prevMonthIndex >= 0) {
                onImageClick?.(monthlyData[prevMonthIndex].startIndex);
              }
            }}
            disabled={currentMonthIndex <= 0}
            className={`p-2 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors`}
          >
            ←
          </button>

          <button
            onClick={() => setIsAutoHighlighting(!isAutoHighlighting)}
            className={`px-4 py-2 ${buttonClass} rounded-lg text-white transition-colors`}
          >
            {isAutoHighlighting ? "Pause Highlights" : "Resume Highlights"}
          </button>

          <button
            onClick={() => {
              const nextMonthIndex = currentMonthIndex + 1;
              if (nextMonthIndex < monthlyData.length) {
                onImageClick?.(monthlyData[nextMonthIndex].startIndex);
              }
            }}
            disabled={currentMonthIndex >= monthlyData.length - 1}
            className={`p-2 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors`}
          >
            →
          </button>
        </div>
      </div>
    );
  };

  // Check if we're in the gallery stage
  const isGalleryStage = shouldShowGallery;

  // Add loading indicator for final collage
  const renderLoadingIndicator = () => {
    const isSpace = theme === "space";
    const textClass = isSpace ? "text-white" : "text-stone-800";

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4" />
          <p className={`${textClass} text-lg`}>Loading your memories...</p>
        </div>
      </div>
    );
  };

  // Handle image load for final collage
  const handleFinalCollageImageLoad = (index: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      "final-collage": {
        isLoading: false,
        loadedCount: (prev["final-collage"]?.loadedCount || 0) + 1,
        totalCount: images.length,
      },
    }));
  };

  // Render final collage
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
                  "A Year in Memories"
                ) : (
                  <>
                    思い出の一年
                    <span className="block text-lg mt-2 text-stone-600">
                      A Year in Memories
                    </span>
                  </>
                )}
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
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
                    onClick={() => setHighlightedImage(image)}
                  >
                    <MemoryImage
                      image={image}
                      isInteractive
                      className="rounded-lg shadow-md transition-transform group-hover:scale-105"
                      onLoad={() => handleFinalCollageImageLoad(idx)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCreateGift && (
            <CreateGiftFlow
              onClose={() => setShowCreateGift(false)}
              onComplete={async (data) => {
                setShowCreateGift(false);
                router.push("/");
              }}
            />
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && renderLoadingIndicator()}
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
              onClick={() => {
                setHighlightedImage(null);
              }}
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

  // Render single image if month has only one image
  if (currentMonth.images.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex items-center justify-center p-4"
      >
        <div className="relative w-full h-[60vh] max-w-4xl">
          <MemoryImage
            image={currentMonth.images[0]}
            className="rounded-lg shadow-xl"
          />
        </div>
      </motion.div>
    );
  }

  // Render monthly collage
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
          layoutId={`month-title-${currentMonth.month}`}
          className="text-3xl font-bold text-white text-center"
        >
          {currentMonth.month}
        </motion.h2>
      </motion.div>

      {/* Images */}
      <motion.div
        className="pt-24 pb-20 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentMonth.images.map((image, index) => (
            <motion.div
              key={image.ipfsHash}
              className="relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => handleImageClick(image)}
              onHoverStart={() => {
                setIsAutoHighlighting(false);
                setFocusedIndex(index);
              }}
              onHoverEnd={() => setFocusedIndex(null)}
            >
              <MemoryImage
                image={image}
                isInteractive
                className={`rounded-lg transition-all duration-300 ${
                  focusedIndex === index || autoHighlightIndex === index
                    ? "scale-110"
                    : ""
                }`}
                onLoad={() =>
                  handleImageLoad(
                    currentMonth.key,
                    index,
                    currentMonth.images.length
                  )
                }
              />
              {(focusedIndex === index || autoHighlightIndex === index) && (
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
          ))}
        </div>
      </motion.div>

      {/* Timeline Controls */}
      {renderTimelineControls()}

      {/* Highlighted Image Overlay */}
      <AnimatePresence>
        {highlightedImage && (
          <motion.div
            key="highlighted-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => {
              setHighlightedImage(null);
              setIsAutoHighlighting(true);
            }}
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
};

export default MonthlyView;
