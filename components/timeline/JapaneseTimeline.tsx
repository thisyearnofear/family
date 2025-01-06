import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  SetStateAction,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import dynamic from "next/dynamic";
import TimelineControls from "./TimelineControls";
import MonthlyView from "./MonthlyView";
import type { ImageProps } from "@utils/types/types";
import JapaneseIntro from "../themes/JapaneseIntro";

const ZenBackground = dynamic(() => import("../themes/ZenBackground"), {
  ssr: false,
});

interface JapaneseTimelineProps {
  images: ImageProps[];
  messages: string[];
  music: string[];
  title?: string;
  isAutoHighlighting: boolean;
  setIsAutoHighlighting: (value: boolean) => void;
}

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    loadedCount: number;
    totalCount: number;
  };
}

interface MonthData {
  key: string;
  month: string;
  images: ImageProps[];
  startIndex: number;
}

const HIGHLIGHT_INTERVAL = 5000; // 5 seconds per photo highlight

// Add type for song object
interface Song {
  path: string;
  title: string;
}

export default function JapaneseTimeline({
  images,
  messages,
  music,
  title,
  isAutoHighlighting,
  setIsAutoHighlighting,
}: JapaneseTimelineProps) {
  console.log("JapaneseTimeline Component Mounted", {
    imagesCount: images?.length,
    messageCount: messages?.length,
    musicCount: music?.length,
    title,
  });

  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  // Filter available songs based on user selection
  const availableSongs = useMemo<Song[]>(() => {
    return music.map((path) => ({
      path,
      title:
        path
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "Unknown",
    }));
  }, [music]);

  useEffect(() => {
    console.log("JapaneseTimeline Effect Running", {
      currentIndex,
      loadingStatesCount: Object.keys(loadingStates).length,
    });
  }, [currentIndex, loadingStates]);

  // Group images by month for loading state tracking
  const monthlyData = useMemo(() => {
    const months: MonthData[] = [];
    let currentStartIndex = 0;

    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateTaken || !b.dateTaken) return 0;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
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
        if (lastMonth.images.length < 10) {
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

    // Add gallery as final stage
    months.push({
      key: "gallery",
      month: "Gallery",
      images: sortedImages,
      startIndex: currentStartIndex,
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

  // Calculate next month loading progress
  const nextMonthLoadingProgress = useMemo(() => {
    if (!nextMonth || !loadingStates[nextMonth.key]) return 0;
    const { loadedCount, totalCount } = loadingStates[nextMonth.key];
    return Math.round((loadedCount / totalCount) * 100);
  }, [nextMonth, loadingStates]);

  // Sound setup with proper cleanup
  const [play, { pause, sound }] = useSound(
    availableSongs[currentSongIndex]?.path || "",
    {
      volume,
      loop: false,
      interrupt: true,
      html5: true,
      onend: () => {
        // When song ends naturally, move to next song
        if (isPlaying && availableSongs.length > 0) {
          setCurrentSongIndex(
            (prev: number) => (prev + 1) % availableSongs.length
          );
        }
      },
    }
  );

  // Keep track of current sound instance
  useEffect(() => {
    // Only cleanup when component unmounts or sound changes
    return () => {
      if (sound) {
        sound.unload();
      }
    };
  }, [sound]); // Add sound to dependencies

  // Handle song changes with respect to available songs
  const handleNextTrack = useCallback(() => {
    if (sound) {
      sound.stop();
    }
    setCurrentSongIndex((prev: number) => {
      if (availableSongs.length === 0) return prev;
      return (prev + 1) % availableSongs.length;
    });
  }, [sound, availableSongs]);

  const handlePreviousTrack = useCallback(() => {
    if (sound) {
      sound.stop();
    }
    setCurrentSongIndex((prev: number) => {
      if (availableSongs.length === 0) return prev;
      return (prev - 1 + availableSongs.length) % availableSongs.length;
    });
  }, [sound, availableSongs]);

  // Handle play/pause
  useEffect(() => {
    if (!sound) return;

    if (isPlaying) {
      sound.play();
    } else {
      sound.pause();
    }

    return () => {
      if (sound && !isPlaying) {
        sound.pause();
      }
    };
  }, [isPlaying, sound]);

  // Handle volume changes
  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [volume, sound]);

  // Start auto-highlighting when intro ends
  useEffect(() => {
    if (!showIntro) {
      setIsAutoHighlighting(true);
    }
  }, [showIntro, setIsAutoHighlighting]);

  // Handle auto-highlighting timer
  useEffect(() => {
    if (!isPlaying || showIntro || !isAutoHighlighting) return;

    // Don't auto-highlight in gallery view
    const isGalleryView = currentMonthIndex === monthlyData.length - 1;
    if (isGalleryView) {
      setIsAutoHighlighting(false);
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const currentMonthImages = currentMonth?.images || [];
        const currentImageIndex = prev - (currentMonth?.startIndex || 0);

        if (currentImageIndex >= currentMonthImages.length - 1) {
          // At the end of current month
          if (currentMonthIndex === monthlyData.length - 2) {
            // About to enter gallery, disable auto-highlighting
            requestAnimationFrame(() => setIsAutoHighlighting(false));
            return monthlyData[monthlyData.length - 1].startIndex;
          }
          // Move to next month
          return nextMonth?.startIndex || prev;
        }
        // Move to next image in current month
        return prev + 1;
      });
    }, HIGHLIGHT_INTERVAL);

    return () => clearInterval(timer);
  }, [
    isPlaying,
    showIntro,
    isAutoHighlighting,
    currentMonth,
    currentMonthIndex,
    monthlyData,
    nextMonth,
    setIsAutoHighlighting,
  ]);

  // Handle month navigation
  const handleNextMonth = useCallback(() => {
    if (currentMonthIndex === monthlyData.length - 1) {
      // Already at gallery, stay there
      return;
    }
    if (!nextMonth) return;

    // If moving to gallery, disable auto-highlighting
    if (currentMonthIndex === monthlyData.length - 2) {
      setIsAutoHighlighting(false);
    }

    setCurrentIndex(nextMonth.startIndex);
  }, [currentMonthIndex, monthlyData.length, nextMonth, setIsAutoHighlighting]);

  const handlePreviousMonth = useCallback(() => {
    const prevMonthIndex = currentMonthIndex - 1;
    if (prevMonthIndex < 0) return;
    setCurrentIndex(monthlyData[prevMonthIndex].startIndex);
  }, [currentMonthIndex, monthlyData]);

  // Handle image click
  const handleImageClick = useCallback(
    (index: number) => {
      setCurrentIndex(index);

      // Check if clicking into gallery view
      const targetMonth = monthlyData.find(
        (month) =>
          index >= month.startIndex &&
          index < month.startIndex + month.images.length
      );

      if (targetMonth?.key === "gallery") {
        setIsAutoHighlighting(false);
      }
    },
    [monthlyData, setIsAutoHighlighting]
  );

  // Memoize the loading states setter
  const handleLoadingStatesChange = useCallback(
    (newLoadingStates: SetStateAction<LoadingState>) => {
      setLoadingStates(newLoadingStates);
    },
    []
  );

  // Add isGalleryView calculation
  const isGalleryView = currentMonthIndex === monthlyData.length - 1;

  // Memoize MonthlyView props
  const monthlyViewProps = useMemo(
    () => ({
      images,
      currentIndex,
      onImageClick: handleImageClick,
      theme: "japanese" as const,
      loadingStates,
      setLoadingStates: handleLoadingStatesChange,
      isAutoHighlighting,
      isGalleryStage: isGalleryView,
      title,
    }),
    [
      images,
      currentIndex,
      handleImageClick,
      loadingStates,
      handleLoadingStatesChange,
      isAutoHighlighting,
      isGalleryView,
      title,
    ]
  );

  // Memoize MonthlyView to prevent unnecessary remounts
  const memoizedMonthlyView = useMemo(
    () => <MonthlyView {...monthlyViewProps} />,
    [monthlyViewProps]
  );

  if (showIntro) {
    console.log("🎌 Rendering JapaneseIntro with messages:", messages);
    return (
      <JapaneseIntro
        onComplete={() => setShowIntro(false)}
        messages={messages}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-white">
      {/* Background layer */}
      <ZenBackground mode="story" />

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        {memoizedMonthlyView}
      </div>

      {/* Controls layer - only shown after intro */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center p-4">
        <TimelineControls
          theme="japanese"
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          volume={volume}
          setVolume={setVolume}
          currentTrack={availableSongs[currentSongIndex]?.title || "No music"}
          firstView={showIntro}
          nextMonthLoadingProgress={nextMonthLoadingProgress}
          onNextTrack={handleNextTrack}
          onPreviousTrack={handlePreviousTrack}
          currentMonth={currentMonth?.month}
          onNextMonth={handleNextMonth}
          onPreviousMonth={handlePreviousMonth}
          showNextMonth={
            !!nextMonth && !loadingStates[nextMonth.key]?.isLoading
          }
          showPreviousMonth={currentMonthIndex > 0}
          isAutoHighlighting={isAutoHighlighting}
          setIsAutoHighlighting={setIsAutoHighlighting}
          showAutoHighlight={!isGalleryView}
          showMusicControls={availableSongs.length > 0}
        />
      </div>
    </div>
  );
}
