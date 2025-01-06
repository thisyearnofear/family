import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  PauseCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface TimelineControlsProps {
  theme: "space" | "japanese";
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  currentTrack: string;
  firstView: boolean;
  nextMonthLoadingProgress: number;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  currentMonth?: string;
  onNextMonth?: () => void;
  onPreviousMonth?: () => void;
  showNextMonth?: boolean;
  showPreviousMonth?: boolean;
  isAutoHighlighting?: boolean;
  setIsAutoHighlighting?: (value: boolean) => void;
  showAutoHighlight?: boolean;
  showMusicControls?: boolean;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  theme,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  currentTrack,
  firstView,
  nextMonthLoadingProgress,
  onNextTrack,
  onPreviousTrack,
  currentMonth,
  onNextMonth,
  onPreviousMonth,
  showNextMonth = true,
  showPreviousMonth = true,
  isAutoHighlighting,
  setIsAutoHighlighting,
  showAutoHighlight,
  showMusicControls,
}) => {
  const isSpaceTheme = theme === "space";
  const isGalleryView = currentMonth === "Gallery";

  // Enhanced background colors for better visibility
  const bgColor = isSpaceTheme
    ? "bg-black/60"
    : "bg-white/80 backdrop-blur-md shadow-lg";

  const hoverBgColor = isSpaceTheme ? "hover:bg-black/80" : "hover:bg-white/90";

  const textColor = isSpaceTheme ? "text-white" : "text-stone-900";

  const highlightColor = isSpaceTheme ? "text-blue-400" : "text-red-600";

  // Add month abbreviation function
  const getAbbreviatedMonth = (monthText: string) => {
    // If it's "Gallery", return as is
    if (monthText === "Gallery") return monthText;

    // Extract month and year
    const [month, year] = monthText.split(" ");
    // Get first 3 letters of month
    const abbr = month.slice(0, 3);
    // Return abbreviated format
    return `${abbr} ${year}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: firstView ? 2 : 0 }}
      className="fixed bottom-0 inset-x-0 p-4 pointer-events-none z-50"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-center gap-4">
        {/* Music controls */}
        {showMusicControls !== false && (
          <div
            className={`flex items-center gap-2 p-2 rounded-2xl ${bgColor} pointer-events-auto touch-feedback border border-current/20`}
          >
            <div className="flex items-center">
              <button
                onClick={onPreviousTrack}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors`}
              >
                <span className="text-lg">‹</span>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors mx-1`}
              >
                <span className="text-lg">{isPlaying ? "❚❚" : "▶"}</span>
              </button>

              <button
                onClick={onNextTrack}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors`}
              >
                <span className="text-lg">›</span>
              </button>
            </div>

            <div className="w-px h-4 bg-current opacity-20 mx-1.5 hidden md:block" />

            <div className="hidden md:flex items-center">
              <button
                onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors`}
              >
                <span className="text-lg">{volume === 0 ? "○" : "●"}</span>
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-current mx-2"
              />

              <span className={`text-xs font-medium ${textColor}`}>
                {currentTrack}
              </span>
            </div>
          </div>
        )}

        {/* Month/Gallery navigation */}
        {currentMonth && (
          <div
            className={`flex items-center gap-2 p-2 rounded-2xl ${bgColor} pointer-events-auto touch-feedback border border-current/20`}
          >
            <div className="flex items-center">
              <button
                onClick={onPreviousMonth}
                disabled={!showPreviousMonth}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-lg">‹</span>
              </button>

              <span className={`text-xs font-medium ${textColor} mx-2`}>
                {getAbbreviatedMonth(isGalleryView ? "Gallery" : currentMonth)}
              </span>

              <button
                onClick={onNextMonth}
                disabled={!showNextMonth}
                className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-lg">›</span>
              </button>
            </div>
          </div>
        )}

        {/* Auto-highlight controls */}
        {showAutoHighlight &&
          isAutoHighlighting !== undefined &&
          setIsAutoHighlighting && (
            <div
              className={`flex items-center gap-2 p-2 rounded-2xl ${bgColor} pointer-events-auto touch-feedback border border-current/20`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => setIsAutoHighlighting(!isAutoHighlighting)}
                  className={`flex items-center justify-center ${hoverBgColor} ${textColor} transition-colors`}
                >
                  <span className="text-lg">
                    {isAutoHighlighting ? "❚❚" : "▶"}
                  </span>
                  <span className="text-xs font-medium ml-2">Auto</span>
                </button>
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
};

export default TimelineControls;
