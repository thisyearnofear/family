import {
  SpeakerWaveIcon as VolumeUpIcon,
  SpeakerXMarkIcon as VolumeOffIcon,
  PauseIcon,
  PlayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface TimelineControlsProps {
  theme: "space" | "japanese";
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentTrack: string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  theme,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentTrack,
}) => {
  const isSpace = theme === "space";
  const bgClass = isSpace
    ? "bg-black/50 border-blue-500/30"
    : "bg-white/50 border-stone-500/30";
  const textClass = isSpace ? "text-white" : "text-stone-800";
  const hoverClass = isSpace ? "hover:bg-blue-900/30" : "hover:bg-stone-200/30";

  return (
    <div
      className="fixed md:right-8 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:left-auto md:translate-x-0 bottom-24 left-1/2 -translate-x-1/2 flex md:flex-col items-center gap-4"
      style={{ zIndex: 50 }}
    >
      {/* Music info and controls */}
      <div
        className={`px-4 py-2 rounded-full backdrop-blur-sm border ${bgClass} flex items-center md:items-center gap-3`}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-full transition-colors ${hoverClass}`}
        >
          {isPlaying ? (
            <PauseIcon className={`w-5 h-5 ${textClass}`} />
          ) : (
            <PlayIcon className={`w-5 h-5 ${textClass}`} />
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

        <div className={`text-sm ${textClass} hidden lg:block`}>
          {currentTrack}
        </div>
      </div>

      {/* Navigation controls */}
      <div
        className={`px-4 py-2 rounded-full backdrop-blur-sm border ${bgClass} flex md:flex-col items-center gap-3`}
      >
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`p-2 rounded-full transition-colors ${hoverClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ArrowLeftIcon className={`w-5 h-5 ${textClass} md:rotate-90`} />
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2 rounded-full transition-colors ${hoverClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ArrowRightIcon className={`w-5 h-5 ${textClass} md:rotate-90`} />
        </button>
      </div>
    </div>
  );
};

export default TimelineControls;
