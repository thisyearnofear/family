import { useEffect, useState } from "react";
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

  // Sound setup
  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
  });

  useEffect(() => {
    if (isPlaying) play();
    else pause();
    return () => pause();
  }, [isPlaying, play, pause]);

  useEffect(() => {
    if (sound) sound.volume(volume);
  }, [volume, sound]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || showIntro) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, showIntro, images.length]);

  // Handle intro completion
  const handleIntroComplete = () => {
    setShowIntro(false);
  };

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
        canGoPrevious={currentIndex > 0}
        canGoNext={currentIndex < images.length - 1}
        currentTrack='"Hopes and Dreams" by Papa'
      />
    </div>
  );
};

export default JapaneseTimeline;
