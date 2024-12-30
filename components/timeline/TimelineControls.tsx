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
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
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
  isAutoHighlighting: boolean;
  setIsAutoHighlighting: (value: boolean) => void;
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
}) => {
  const isSpaceTheme = theme === "space";
  const bgColor = isSpaceTheme ? "bg-black/40" : "bg-stone-900/20";
  const hoverBgColor = isSpaceTheme
    ? "hover:bg-black/60"
    : "hover:bg-stone-900/30";
  const textColor = isSpaceTheme ? "text-white" : "text-stone-800";
  const highlightColor = isSpaceTheme ? "text-blue-400" : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: firstView ? 2 : 0 }}
      className="fixed bottom-0 inset-x-0 p-4 pointer-events-none z-50"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Music controls */}
        <div
          className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-lg ${bgColor} pointer-events-auto touch-feedback`}
        >
          <button
            onClick={onPreviousTrack}
            className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button`}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button`}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button`}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-current opacity-20 mx-2 hidden md:block" />

          <button
            onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
            className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button hidden md:block`}
          >
            {volume === 0 ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-current hidden md:block"
          />

          <div className="ml-2 hidden md:block">
            <p className={`text-sm font-medium ${textColor}`}>{currentTrack}</p>
          </div>
        </div>

        {/* Simple month navigation */}
        {currentMonth && (
          <div
            className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-lg ${bgColor} pointer-events-auto touch-feedback`}
          >
            <button
              onClick={onPreviousMonth}
              disabled={!showPreviousMonth}
              className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className={`text-sm font-medium ${textColor}`}>
              {currentMonth}
            </span>
            <button
              onClick={onNextMonth}
              disabled={!showNextMonth}
              className={`p-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors mobile-button disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Auto-highlight controls */}
        <div
          className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-lg ${bgColor} pointer-events-auto touch-feedback`}
        >
          <button
            onClick={() => setIsAutoHighlighting(!isAutoHighlighting)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${hoverBgColor} ${textColor} transition-colors`}
          >
            {isAutoHighlighting ? (
              <>
                <PauseCircleIcon className={`w-5 h-5 ${highlightColor}`} />
                <span className="text-sm font-medium">Pause Highlights</span>
              </>
            ) : (
              <>
                <PlayCircleIcon className={`w-5 h-5 ${highlightColor}`} />
                <span className="text-sm font-medium">Auto Highlight</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineControls;
