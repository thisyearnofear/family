import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IoPlaySharp, IoPauseSharp } from "react-icons/io5";
import { BsVolumeUp, BsVolumeMute } from "react-icons/bs";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";

interface TimelineControlsProps {
  theme: "japanese" | "space";
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  showPrevious: boolean;
  showNext: boolean;
  currentTrack?: string;
  firstView?: boolean;
  timeToNextMonth?: number;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  theme,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  onPrevious,
  onNext,
  showPrevious,
  showNext,
  currentTrack,
  firstView = false,
  timeToNextMonth = 5000, // Default 5 seconds
}) => {
  const [progress, setProgress] = useState(0);
  const isSpace = theme === "space";
  const bgClass = isSpace ? "bg-black/50" : "bg-white/50";
  const textClass = isSpace ? "text-white" : "text-stone-800";
  const borderClass = isSpace ? "border-blue-500/30" : "border-stone-500/30";

  // Progress timer for first viewing
  useEffect(() => {
    if (!firstView || !isPlaying) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / timeToNextMonth) * 100;

      if (newProgress >= 100) {
        setProgress(0);
        clearInterval(interval);
      } else {
        setProgress(newProgress);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [firstView, isPlaying, timeToNextMonth]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${bgClass} backdrop-blur-sm rounded-full border ${borderClass} shadow-lg overflow-hidden`}
    >
      {/* Progress bar for first viewing */}
      {firstView && isPlaying && (
        <motion.div
          className={`absolute bottom-0 left-0 h-1 ${
            isSpace ? "bg-blue-500" : "bg-red-500"
          }`}
          style={{ width: "100%" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      )}

      <div className="px-6 py-3 flex items-center gap-4">
        {/* Music controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-full transition-colors ${
              isSpace ? "hover:bg-blue-500/20" : "hover:bg-stone-500/20"
            }`}
          >
            {isPlaying ? (
              <IoPauseSharp className={textClass} size={24} />
            ) : (
              <IoPlaySharp className={textClass} size={24} />
            )}
          </button>

          <button
            onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
            className={`p-2 rounded-full transition-colors ${
              isSpace ? "hover:bg-blue-500/20" : "hover:bg-stone-500/20"
            }`}
          >
            {volume > 0 ? (
              <BsVolumeUp className={textClass} size={24} />
            ) : (
              <BsVolumeMute className={textClass} size={24} />
            )}
          </button>

          {currentTrack && (
            <span className={`text-sm ${textClass} hidden sm:inline-block`}>
              {currentTrack}
            </span>
          )}
        </div>

        {/* Navigation controls - only show after first viewing */}
        {!firstView && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={!showPrevious}
              className={`p-2 rounded-full transition-colors ${
                showPrevious
                  ? isSpace
                    ? "hover:bg-blue-500/20"
                    : "hover:bg-stone-500/20"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <MdNavigateBefore className={textClass} size={24} />
            </button>
            <button
              onClick={onNext}
              disabled={!showNext}
              className={`p-2 rounded-full transition-colors ${
                showNext
                  ? isSpace
                    ? "hover:bg-blue-500/20"
                    : "hover:bg-stone-500/20"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <MdNavigateNext className={textClass} size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineControls;
