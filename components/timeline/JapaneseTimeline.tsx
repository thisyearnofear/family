import { useEffect, useState, useCallback, useMemo } from "react";
import useSound from "use-sound";
import TimelineControls from "./TimelineControls";
import MonthlyView from "./MonthlyView";
import dynamic from "next/dynamic";
import type { ImageProps } from "../../utils/types/types";

const JapaneseIntro = dynamic(() => import("../themes/JapaneseIntro"), {
  ssr: false,
});
const ZenBackground = dynamic(() => import("../themes/ZenBackground"), {
  ssr: false,
});

interface JapaneseTimelineProps {
  images: ImageProps[];
}

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    loadedCount: number;
    totalCount: number;
  };
}

interface JapaneseIntroProps {
  onComplete: () => void;
}

interface MonthData {
  key: string;
  month: string;
  images: ImageProps[];
  startIndex: number;
}

const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
];

const JapaneseTimeline: React.FC<JapaneseTimelineProps> = ({ images }) => {
  console.log("JapaneseTimeline Component Mounted", {
    imagesCount: images?.length,
  });

  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [hasCompletedFirstView, setHasCompletedFirstView] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

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
  const [play, { pause, sound }] = useSound(SONGS[currentSongIndex].path, {
    volume,
    loop: false,
    interrupt: true,
    html5: true,
    onend: () => {
      // When song ends naturally, move to next song
      if (isPlaying) {
        setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
      }
    },
  });

  // Keep track of current sound instance
  useEffect(() => {
    return () => {
      // Cleanup previous sound when unmounting or changing songs
      if (sound) {
        sound.unload();
      }
    };
  }, [sound]);

  // Handle song changes
  const handleNextTrack = useCallback(() => {
    if (sound) {
      sound.unload(); // Properly unload the current sound
    }
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
  }, [sound]);

  const handlePreviousTrack = useCallback(() => {
    if (sound) {
      sound.unload(); // Properly unload the current sound
    }
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  }, [sound]);

  // Handle play/pause
  useEffect(() => {
    if (!sound) return;

    if (isPlaying) {
      sound.play();
    } else {
      sound.pause();
    }

    return () => {
      sound.pause();
    };
  }, [isPlaying, sound]);

  // Handle volume changes
  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [volume, sound]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || showIntro) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          setIsPlaying(false);
          return images.length - 1; // Ensure we stay at the last image
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, showIntro, images.length]);

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setHasCompletedFirstView(true);
  }, []);

  // Handle month navigation
  const handleNextMonth = useCallback(() => {
    if (currentMonthIndex === monthlyData.length - 1) {
      // If we're at the last month, go to the last image
      setCurrentIndex(images.length - 1);
      return;
    }
    if (!nextMonth) return;
    setCurrentIndex(nextMonth.startIndex);
  }, [nextMonth, currentMonthIndex, monthlyData.length, images.length]);

  const handlePreviousMonth = useCallback(() => {
    const prevMonthIndex = currentMonthIndex - 1;
    if (prevMonthIndex < 0) return;
    setCurrentIndex(monthlyData[prevMonthIndex].startIndex);
  }, [currentMonthIndex, monthlyData]);

  if (showIntro) {
    return <JapaneseIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="fixed inset-0 bg-white">
      {/* Background layer */}
      <ZenBackground mode="story" />

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        <MonthlyView
          images={images}
          currentIndex={currentIndex}
          onImageClick={setCurrentIndex}
          theme="japanese"
          loadingStates={loadingStates}
          setLoadingStates={setLoadingStates}
        />
      </div>

      {/* Controls layer - only shown after intro */}
      <TimelineControls
        theme="japanese"
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        volume={volume}
        setVolume={setVolume}
        currentTrack={`"${SONGS[currentSongIndex].title}" by Papa`}
        firstView={!hasCompletedFirstView}
        nextMonthLoadingProgress={nextMonthLoadingProgress}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        currentMonth={currentMonth?.month}
        onNextMonth={handleNextMonth}
        onPreviousMonth={handlePreviousMonth}
        showNextMonth={!!nextMonth && !loadingStates[nextMonth.key]?.isLoading}
        showPreviousMonth={currentMonthIndex > 0}
      />
    </div>
  );
};

export default JapaneseTimeline;
