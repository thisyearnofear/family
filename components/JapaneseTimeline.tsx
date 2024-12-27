import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import { AnimatedContainer } from "./AnimatedContainer";
import TimelineControls from "./TimelineControls";
import MonthlyView from "./MonthlyView";
import dynamic from "next/dynamic";
import type { ImageProps } from "../utils/types";

const JapaneseIntro = dynamic(() => import("./JapaneseIntro"), { ssr: false });
const ZenBackground = dynamic(() => import("./ZenBackground"), { ssr: false });

interface JapaneseTimelineProps {
  images: ImageProps[];
}

const JapaneseTimeline: React.FC<JapaneseTimelineProps> = ({ images = [] }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [hasCompletedFirstView, setHasCompletedFirstView] = useState(false);

  // Sound setup with sprite to prevent audio gaps
  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
    interrupt: false,
    html5: true, // This helps with mobile playback
  });

  // Memoized play/pause handlers
  const handlePlay = useCallback(() => {
    try {
      play();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [play]);

  const handlePause = useCallback(() => {
    try {
      pause();
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }, [pause]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }
    return () => handlePause();
  }, [isPlaying, handlePlay, handlePause]);

  // Handle volume changes
  useEffect(() => {
    if (sound) {
      try {
        sound.volume(volume);
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    }
  }, [volume, sound]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || showIntro) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          setIsPlaying(false);
          setHasCompletedFirstView(true);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, showIntro, images.length]);

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  if (showIntro) {
    return <JapaneseIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="fixed inset-0 bg-white">
      <ZenBackground mode="story" />

      <MonthlyView
        images={images}
        currentIndex={currentIndex}
        onImageClick={setCurrentIndex}
      />

      <TimelineControls
        theme="japanese"
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        volume={volume}
        setVolume={setVolume}
        onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        onNext={() =>
          setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1))
        }
        showPrevious={currentIndex > 0}
        showNext={currentIndex < images.length - 1}
        currentTrack='"Hopes and Dreams" by Papa'
        firstView={!hasCompletedFirstView}
      />
    </div>
  );
};

export default JapaneseTimeline;
