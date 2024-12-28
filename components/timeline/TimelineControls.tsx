import { motion } from "framer-motion";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { MusicalNoteIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";

interface TimelineControlsProps {
  theme: "space" | "japanese";
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentTrack?: string;
  firstView?: boolean;
  nextMonthLoadingProgress?: number;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  currentMonth?: string;
  onNextMonth?: () => void;
  onPreviousMonth?: () => void;
  showNextMonth?: boolean;
  showPreviousMonth?: boolean;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  theme,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  currentTrack,
  firstView = false,
  nextMonthLoadingProgress = 0,
  onNextTrack,
  onPreviousTrack,
  currentMonth,
  onNextMonth,
  onPreviousMonth,
  showNextMonth,
  showPreviousMonth,
}) => {
  const [showReadyIndicator, setShowReadyIndicator] = useState(false);
  const isSpace = theme === "space";
  const bgClass = isSpace ? "bg-black/50" : "bg-white/80";
  const textClass = isSpace ? "text-white" : "text-stone-900";
  const borderClass = isSpace ? "border-blue-500/30" : "border-stone-500/50";
  const accentColor = isSpace ? "rgb(59, 130, 246)" : "rgb(239, 68, 68)";
  const hoverClass = isSpace ? "hover:bg-blue-500/20" : "hover:bg-stone-500/30";
  const disabledClass = "opacity-50 cursor-not-allowed";

  // Show ready indicator when next month is fully loaded
  useEffect(() => {
    if (nextMonthLoadingProgress === 100 && !showReadyIndicator) {
      setShowReadyIndicator(true);
      const timer = setTimeout(() => setShowReadyIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [nextMonthLoadingProgress, showReadyIndicator]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      <div
        className={`${bgClass} backdrop-blur-md border-t ${borderClass} shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
          {/* Mobile view: Two rows layout */}
          <div className="block sm:hidden">
            {/* Top row: Month navigation */}
            {currentMonth && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={onPreviousMonth}
                  disabled={!showPreviousMonth}
                  className={`p-1.5 rounded-full transition-colors ${
                    showPreviousMonth ? hoverClass : disabledClass
                  }`}
                >
                  <ChevronLeftIcon
                    className={textClass}
                    width={24}
                    height={24}
                  />
                </button>
                <span className={`text-base font-medium ${textClass}`}>
                  {currentMonth}
                </span>
                <div className="relative">
                  <button
                    onClick={onNextMonth}
                    disabled={!showNextMonth}
                    className={`p-1.5 rounded-full transition-colors ${
                      showNextMonth ? hoverClass : disabledClass
                    }`}
                  >
                    <ChevronRightIcon
                      className={`${textClass} transition-colors duration-500 ${
                        showReadyIndicator
                          ? isSpace
                            ? "text-blue-500"
                            : "text-red-500"
                          : ""
                      }`}
                      width={24}
                      height={24}
                    />
                  </button>
                  {/* Loading progress circle */}
                  {nextMonthLoadingProgress > 0 &&
                    nextMonthLoadingProgress < 100 && (
                      <svg
                        className="absolute inset-0 -m-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={`${accentColor}33`}
                          strokeWidth="2"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={accentColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={`${
                            nextMonthLoadingProgress * 2.83
                          }, 283`}
                          className="transition-all duration-300"
                        />
                      </svg>
                    )}
                </div>
              </div>
            )}

            {/* Bottom row: Music controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-1.5 rounded-full transition-colors ${hoverClass}`}
                >
                  {isPlaying ? (
                    <PauseIcon className={textClass} width={24} height={24} />
                  ) : (
                    <PlayIcon className={textClass} width={24} height={24} />
                  )}
                </button>
                <button
                  onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                  className={`p-1.5 rounded-full transition-colors ${hoverClass}`}
                >
                  {volume > 0 ? (
                    <SpeakerWaveIcon
                      className={textClass}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <SpeakerXMarkIcon
                      className={textClass}
                      width={24}
                      height={24}
                    />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPreviousTrack}
                  className={`p-1.5 rounded-full transition-colors ${hoverClass}`}
                >
                  <ChevronLeftIcon
                    className={textClass}
                    width={20}
                    height={20}
                  />
                </button>
                {currentTrack && (
                  <span
                    className={`text-sm ${textClass} max-w-[150px] truncate font-medium`}
                  >
                    {currentTrack}
                  </span>
                )}
                <button
                  onClick={onNextTrack}
                  className={`p-1.5 rounded-full transition-colors ${hoverClass}`}
                >
                  <ChevronRightIcon
                    className={textClass}
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop view: Single row layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Left section: Music controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 rounded-full transition-colors ${hoverClass}`}
                >
                  {isPlaying ? (
                    <PauseIcon className={textClass} width={24} height={24} />
                  ) : (
                    <PlayIcon className={textClass} width={24} height={24} />
                  )}
                </button>
                <button
                  onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                  className={`p-2 rounded-full transition-colors ${hoverClass}`}
                >
                  {volume > 0 ? (
                    <SpeakerWaveIcon
                      className={textClass}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <SpeakerXMarkIcon
                      className={textClass}
                      width={24}
                      height={24}
                    />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onPreviousTrack}
                  className={`p-2 rounded-full transition-colors ${hoverClass}`}
                >
                  <ChevronLeftIcon
                    className={textClass}
                    width={24}
                    height={24}
                  />
                </button>
                {currentTrack && (
                  <span
                    className={`text-base ${textClass} font-medium min-w-[200px]`}
                  >
                    {currentTrack}
                  </span>
                )}
                <button
                  onClick={onNextTrack}
                  className={`p-2 rounded-full transition-colors ${hoverClass}`}
                >
                  <ChevronRightIcon
                    className={textClass}
                    width={24}
                    height={24}
                  />
                </button>
              </div>
            </div>

            {/* Right section: Month navigation */}
            {currentMonth && (
              <div className="flex items-center gap-3">
                <button
                  onClick={onPreviousMonth}
                  disabled={!showPreviousMonth}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    showPreviousMonth ? hoverClass : disabledClass
                  }`}
                >
                  <ChevronLeftIcon
                    className={textClass}
                    width={28}
                    height={28}
                  />
                </button>
                <motion.span
                  key={currentMonth}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-lg font-medium ${textClass} min-w-[200px] text-center`}
                >
                  {currentMonth}
                </motion.span>
                <div className="relative">
                  <button
                    onClick={onNextMonth}
                    disabled={!showNextMonth}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      showNextMonth ? hoverClass : disabledClass
                    } ${showReadyIndicator ? "scale-110" : ""}`}
                  >
                    <ChevronRightIcon
                      className={`${textClass} transition-colors duration-500 ${
                        showReadyIndicator
                          ? isSpace
                            ? "text-blue-500"
                            : "text-red-500"
                          : ""
                      }`}
                      width={28}
                      height={28}
                    />
                  </button>

                  {/* Loading progress circle */}
                  {nextMonthLoadingProgress > 0 &&
                    nextMonthLoadingProgress < 100 && (
                      <motion.svg
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 -m-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={`${accentColor}33`}
                          strokeWidth="2"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={accentColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{
                            pathLength: nextMonthLoadingProgress / 100,
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{
                            strokeDasharray: "283",
                            strokeDashoffset: "283",
                          }}
                        />
                      </motion.svg>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;
