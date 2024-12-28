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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [hasCompletedFirstView, setHasCompletedFirstView] = useState(false);

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

    return months;
  }, [images]);

  // Find current month and next month
  const currentMonthIndex = monthlyData.findIndex(
    (month) =>
      currentIndex >= month.startIndex &&
      currentIndex < month.startIndex + month.images.length
  );

  const currentMonth = monthlyData[currentMonthIndex];
  const nextMonth = monthlyData[currentMonthIndex + 1];

  // Handle image load completion
  const handleImageLoad = useCallback(
    (monthKey: string, imageIndex: number, totalImages: number) => {
      console.log(
        `Image ${imageIndex + 1}/${totalImages} loaded in ${monthKey}`
      );

      setLoadingStates((prev) => {
        const currentState = prev[monthKey] || {
          isLoading: true,
          loadedCount: 0,
          totalCount: totalImages,
        };

        const newLoadedCount = Math.min(
          currentState.loadedCount + 1,
          totalImages
        );
        const newState = {
          ...prev,
          [monthKey]: {
            ...currentState,
            loadedCount: newLoadedCount,
            isLoading: newLoadedCount < totalImages,
          },
        };

        console.log(
          `${monthKey} loading progress: ${newLoadedCount}/${totalImages}`
        );
        return newState;
      });
    },
    [setLoadingStates]
  );

  // Modify the preload effect to use cache
  useEffect(() => {
    if (!currentMonth) return;

    // Debug logging for environment variables
    console.log("Environment Variables Debug:");
    console.log(
      "NEXT_PUBLIC_PINATA_GATEWAY:",
      process.env.NEXT_PUBLIC_PINATA_GATEWAY
    );
    console.log(
      "NEXT_PUBLIC_PINATA_GROUP_ID:",
      process.env.NEXT_PUBLIC_PINATA_GROUP_ID
    );

    // Test if we're in production
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("NEXT_PUBLIC_ENV:", process.env.NEXT_PUBLIC_ENV);

    // Find the next two months to preload
    const currentMonthIndex = monthlyData.findIndex(
      (month) => month.key === currentMonth.key
    );
    const nextTwoMonths = monthlyData.slice(
      currentMonthIndex + 1,
      currentMonthIndex + 3
    );

    nextTwoMonths.forEach((month) => {
      console.log(`Preloading month: ${month.month}`);
      if (month.images && month.images.length > 0) {
        console.log("Sample image hash:", month.images[0].ipfsHash);
      }

      // Initialize loading state for month if not exists
      setLoadingStates((prev) => ({
        ...prev,
        [month.key]: prev[month.key] || {
          isLoading: true,
          loadedCount: 0,
          totalCount: month.images.length,
        },
      }));

      // Preload all images in the month using cache
      month.images.forEach((image) => {
        if (imageCache.has(image.ipfsHash)) {
          // If image is already cached, mark it as loaded
          handleImageLoad(
            month.key,
            month.images.indexOf(image),
            month.images.length
          );
          return;
        }

        const img = new Image();
        const gateway =
          process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
          "https://gateway.pinata.cloud/ipfs";
        const imageUrl = image.ipfsHash.startsWith("http")
          ? image.ipfsHash
          : `${gateway}/${image.ipfsHash}`;

        // Debug logging for image URLs and construction
        console.log("Image URL Construction:");
        console.log("- Gateway:", gateway);
        console.log("- IPFS Hash:", image.ipfsHash);
        console.log("- Final URL:", imageUrl);

        img.onload = () => {
          console.log("Successfully loaded:", imageUrl);
          imageCache.preload(image);
          handleImageLoad(
            month.key,
            month.images.indexOf(image),
            month.images.length
          );
        };

        img.onerror = (error) => {
          console.error("Failed to load image:", {
            url: imageUrl,
            error: error,
            gateway: gateway,
            hash: image.ipfsHash,
          });
          handleImageLoad(
            month.key,
            month.images.indexOf(image),
            month.images.length
          );
        };

        img.src = imageUrl;
      });
    });
  }, [
    currentMonth?.key,
    monthlyData,
    imageCache,
    handleImageLoad,
    setLoadingStates,
  ]);

  // Auto-focus effect for gallery view
  useEffect(() => {
    if (
      !currentMonth ||
      currentMonth.images.length <= 1 ||
      loadingStates[currentMonth.key]?.isLoading
    ) {
      // Clear any existing highlight when conditions aren't met
      setFocusedIndex(null);
      setHighlightedImage(null);
      return;
    }

    console.log(
      `Starting cycle for ${currentMonth.month} with ${currentMonth.images.length} images`
    );

    let timeoutId: NodeJS.Timeout;
    let transitionTimeoutId: NodeJS.Timeout;

    const cycleImages = (index: number) => {
      console.log(
        `Cycling to image ${index + 1}/${currentMonth.images.length} in ${
          currentMonth.month
        }`
      );

      setFocusedIndex(index);
      setHighlightedImage(currentMonth.images[index]);

      // Schedule next image after highlight duration
      timeoutId = setTimeout(() => {
        console.log(
          `Transitioning out image ${index + 1} in ${currentMonth.month}`
        );
        setHighlightedImage(null);

        // Wait for transition out before moving to next image
        transitionTimeoutId = setTimeout(() => {
          const nextIndex = (index + 1) % currentMonth.images.length;
          console.log(
            `Moving to next image ${nextIndex + 1} in ${currentMonth.month}`
          );
          cycleImages(nextIndex);
        }, TRANSITION_DURATION * 1000);
      }, HIGHLIGHT_DURATION);
    };

    // Start the cycle
    cycleImages(0);

    // Cleanup function
    return () => {
      console.log(`Cleaning up cycle for ${currentMonth.month}`);
      clearTimeout(timeoutId);
      clearTimeout(transitionTimeoutId);
      setFocusedIndex(null);
      setHighlightedImage(null);
    };
  }, [currentMonth, loadingStates]);

  // Reset carousel index when month changes
  useEffect(() => {
    if (currentMonth?.key) {
      setCarouselIndex(0);
    }
  }, [currentMonth?.key]);

  // Loading carousel effect
  useEffect(() => {
    const isMonthLoading =
      currentMonth?.key && loadingStates[currentMonth.key]?.isLoading;
    const hasMultipleImages = currentMonth?.images?.length > 1;

    if (!isMonthLoading || !hasMultipleImages || !currentMonth) return;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % currentMonth.images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [currentMonth, loadingStates, currentMonth?.images?.length]);

  // Check if we're at the end
  const isLastImage = currentIndex === images.length - 1;

  // Render highlighted image overlay
  const renderHighlightedImage = () => {
    if (!highlightedImage) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: TRANSITION_DURATION, ease: "easeInOut" }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-5xl h-[80vh] p-8">
          <MemoryImage
            image={highlightedImage}
            className="rounded-lg shadow-2xl"
            onLoad={() => {
              /* Handle load complete */
            }}
          />
        </div>
      </motion.div>
    );
  };

  // Modify the grid rendering to include transitions
  const renderPhotoGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {currentMonth?.images.map((image, idx) => (
        <motion.div
          key={image.ipfsHash}
          className="relative aspect-square h-[200px] cursor-pointer group"
          onClick={() => setHighlightedImage(image)}
          animate={{
            scale: focusedIndex === idx ? 1.05 : 1,
            filter: focusedIndex === idx ? "brightness(1.1)" : "brightness(1)",
            transition: { duration: 0.5 },
          }}
        >
          <div
            className={`absolute inset-0 z-10 transition-opacity duration-500 ${
              focusedIndex === idx ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {theme === "japanese" ? (
              <div className="absolute bottom-2 left-2 text-white text-sm font-japanese">
                思い出 {idx + 1}
              </div>
            ) : (
              <div className="absolute bottom-2 left-2 text-white text-sm">
                Memory {idx + 1}
              </div>
            )}
          </div>
          <MemoryImage
            image={image}
            isInteractive
            className={`rounded-lg shadow-md transition-all duration-500 ${
              focusedIndex === idx
                ? "shadow-lg ring-2 ring-white/30"
                : "group-hover:scale-105"
            }`}
            onLoad={() =>
              handleImageLoad(currentMonth.key, idx, currentMonth.images.length)
            }
          />
        </motion.div>
      ))}
    </div>
  );

  // Calculate next month loading progress
  const nextMonthLoadingProgress = useMemo(() => {
    if (!nextMonth || !loadingStates[nextMonth.key]) return 0;
    const { loadedCount, totalCount } = loadingStates[nextMonth.key];
    return Math.round((loadedCount / totalCount) * 100);
  }, [nextMonth, loadingStates]);

  // Pass loading progress to TimelineControls
  const renderTimelineControls = () => (
    <TimelineControls
      theme={theme}
      isPlaying={isPlaying}
      setIsPlaying={setIsPlaying}
      volume={volume}
      setVolume={setVolume}
      currentTrack={`"${SONGS[currentSongIndex].title}" by Papa`}
      firstView={!hasCompletedFirstView}
      nextMonthLoadingProgress={nextMonthLoadingProgress}
      onNextTrack={() =>
        setCurrentSongIndex((prev) => (prev + 1) % SONGS.length)
      }
      onPreviousTrack={() =>
        setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length)
      }
      currentMonth={currentMonth?.month}
      onNextMonth={() => {
        const nextMonthIndex = currentMonthIndex + 1;
        if (nextMonthIndex < monthlyData.length) {
          onImageClick?.(monthlyData[nextMonthIndex].startIndex);
        }
      }}
      onPreviousMonth={() => {
        const prevMonthIndex = currentMonthIndex - 1;
        if (prevMonthIndex >= 0) {
          onImageClick?.(monthlyData[prevMonthIndex].startIndex);
        }
      }}
      showNextMonth={currentMonthIndex < monthlyData.length - 1}
      showPreviousMonth={currentMonthIndex > 0}
    />
  );

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
                  "Family Wrapped 2024"
                ) : (
                  <>
                    思い出の一年
                    <span className="block text-lg mt-2 text-stone-600">
                      A Year of Memories
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
                    onClick={() => onImageClick?.(idx)}
                  >
                    <MemoryImage
                      image={image}
                      isInteractive
                      className="rounded-lg shadow-md transition-transform group-hover:scale-105"
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
    <AnimatePresence mode="wait">
      {currentMonth && (
        <motion.div
          key={currentMonth.key}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: MONTH_TRANSITION_DURATION,
          }}
          className="w-full h-full flex flex-col items-center p-4 gap-4 relative"
        >
          {/* Fixed header with month title */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-10 flex flex-col items-center pt-4 pb-2 bg-gradient-to-b from-black/50 to-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2, duration: TRANSITION_DURATION }}
          >
            <motion.h2
              className={`text-2xl ${
                theme === "space"
                  ? "text-white"
                  : "font-japanese text-stone-800"
              }`}
              layoutId="month-title"
            >
              {currentMonth.month}
            </motion.h2>
          </motion.div>

          {/* Loading indicator with carousel */}
          <AnimatePresence>
            {loadingStates[currentMonth.key]?.isLoading &&
              currentMonth.images.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="w-full max-w-2xl h-[40vh] relative mb-8"
                  >
                    <motion.div
                      key={carouselIndex}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="absolute inset-0"
                    >
                      <MemoryImage
                        image={currentMonth.images[carouselIndex]}
                        className="rounded-lg shadow-xl opacity-75"
                      />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-white text-lg">
                        Loading...{" "}
                        {loadingStates[currentMonth.key]?.loadedCount || 0}/
                        {loadingStates[currentMonth.key]?.totalCount || 0}
                      </span>
                    </div>
                    <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${
                            ((loadingStates[currentMonth.key]?.loadedCount ||
                              0) /
                              (loadingStates[currentMonth.key]?.totalCount ||
                                1)) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Scrollable gallery with staggered animations */}
          <motion.div
            className="w-full max-w-6xl flex-1 overflow-y-auto mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {currentMonth?.images.map((image, idx) => (
                <motion.div
                  key={image.ipfsHash}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    delay: idx * 0.1,
                    duration: TRANSITION_DURATION,
                  }}
                  className="relative aspect-square h-[200px] cursor-pointer group"
                  onClick={() => setHighlightedImage(image)}
                >
                  <div
                    className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                      focusedIndex === idx ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {theme === "japanese" ? (
                      <div className="absolute bottom-2 left-2 text-white text-sm font-japanese">
                        思い出 {idx + 1}
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2 text-white text-sm">
                        Memory {idx + 1}
                      </div>
                    )}
                  </div>
                  <MemoryImage
                    image={image}
                    isInteractive
                    className={`rounded-lg shadow-md transition-all duration-500 ${
                      focusedIndex === idx
                        ? "shadow-lg ring-2 ring-white/30"
                        : "group-hover:scale-105"
                    }`}
                    onLoad={() =>
                      handleImageLoad(
                        currentMonth.key,
                        idx,
                        currentMonth.images.length
                      )
                    }
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Highlighted image overlay */}
          <AnimatePresence mode="wait">
            {renderHighlightedImage()}
          </AnimatePresence>

          {/* Fixed controls at the bottom */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: TRANSITION_DURATION }}
          >
            {renderTimelineControls()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MonthlyView;
