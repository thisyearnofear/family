import {
  SpeakerWaveIcon as VolumeUpIcon,
  SpeakerXMarkIcon as VolumeOffIcon,
  PauseIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface TimelineControlsProps {
  theme: "space" | "japanese";
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
  firstView?: boolean;
  currentTrack?: string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  theme,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  onPrevious,
  onNext,
  showPrevious = true,
  showNext = true,
  firstView = false,
  currentTrack,
}) => {
  const isSpace = theme === "space";
  const bgClass = isSpace ? "bg-black/50" : "bg-white/50";
  const textClass = isSpace ? "text-white" : "text-stone-800";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-4">
      {/* Music controls */}
      <div
        className={`${bgClass} backdrop-blur-sm rounded-full p-4 flex items-center gap-4`}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          {isPlaying ? (
            <PauseIcon className={`w-6 h-6 ${textClass}`} />
          ) : (
            <PlayIcon className={`w-6 h-6 ${textClass}`} />
          )}
        </button>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={`w-20 ${
              isSpace ? "accent-blue-500" : "accent-stone-500"
            }`}
          />
          {volume === 0 ? (
            <VolumeOffIcon className={`w-5 h-5 ${textClass}`} />
          ) : (
            <VolumeUpIcon className={`w-5 h-5 ${textClass}`} />
          )}
        </div>

        {currentTrack && (
          <span className={`text-sm ${textClass} hidden sm:block`}>
            {currentTrack}
          </span>
        )}
      </div>

      {/* Navigation controls */}
      {!firstView && (showPrevious || showNext) && (
        <div
          className={`${bgClass} backdrop-blur-sm rounded-full p-4 flex items-center gap-4`}
        >
          {showPrevious && (
            <button
              onClick={onPrevious}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeftIcon className={`w-6 h-6 ${textClass}`} />
            </button>
          )}

          {showNext && (
            <button
              onClick={onNext}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRightIcon className={`w-6 h-6 ${textClass}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineControls;
