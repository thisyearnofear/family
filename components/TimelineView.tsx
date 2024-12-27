import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useTimeline } from "../contexts/TimelineContext";
import { AnimatedContainer } from "./AnimatedContainer";
import LazyImage from "./LazyImage";
import TimelineControls from "./TimelineControls";
import MonthlyCollage from "./MonthlyCollage";
import useSound from "use-sound";

interface TimelineViewProps {
  onComplete?: () => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ onComplete }) => {
  const { state, dispatch } = useTimeline();
  const { currentIndex, isPlaying, volume, groupedImages, theme } = state;

  // Sound setup
  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
  });

  // Sound effects
  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [volume, sound]);

  const allImages = groupedImages.flatMap((group) => group.images);
  const currentImage = allImages[currentIndex];
  const currentMonthIndex = groupedImages.findIndex((group) =>
    group.images.some((img) => img === currentImage)
  );
  const currentGroup = groupedImages[currentMonthIndex];
  const isMonthEnd =
    currentGroup &&
    currentGroup.images[currentGroup.images.length - 1] === currentImage;
  const isLastImage = currentIndex === allImages.length - 1;

  const renderContent = () => {
    if (isLastImage) {
      return (
        <AnimatedContainer
          variant="scale"
          className="fixed inset-0 flex flex-col items-center justify-center"
        >
          <h2
            className={`text-4xl mb-8 ${
              theme === "japanese"
                ? "font-japanese text-stone-800"
                : "font-bold text-blue-400"
            }`}
          >
            {theme === "japanese" ? "思い出の一年" : "A Year of Memories"}
          </h2>
          <div className="w-full max-w-6xl p-8">
            <MonthlyCollage
              month=""
              images={allImages}
              theme={theme}
              onImageClick={(image) => {
                const newIndex = allImages.findIndex(
                  (img) => img.ipfsHash === image.ipfsHash
                );
                if (newIndex !== -1)
                  dispatch({ type: "SET_INDEX", payload: newIndex });
              }}
            />
          </div>
        </AnimatedContainer>
      );
    }

    if (isMonthEnd && currentGroup && currentGroup.images.length > 1) {
      return (
        <AnimatedContainer
          variant="scale"
          className="fixed inset-0 flex items-center justify-center"
        >
          <MonthlyCollage
            month={currentGroup.month}
            images={currentGroup.images}
            theme={theme}
            onImageClick={(image) => {
              const newIndex = allImages.findIndex(
                (img) => img.ipfsHash === image.ipfsHash
              );
              if (newIndex !== -1)
                dispatch({ type: "SET_INDEX", payload: newIndex });
            }}
          />
        </AnimatedContainer>
      );
    }

    return (
      <AnimatedContainer
        variant="scale"
        className="fixed inset-0 flex items-center justify-center"
      >
        <div className="relative w-full max-w-4xl h-full max-h-[80vh] p-4">
          <LazyImage
            image={currentImage}
            className="rounded-lg overflow-hidden"
            onLoad={() => {
              /* Handle load complete */
            }}
          />
        </div>
      </AnimatedContainer>
    );
  };

  return (
    <div
      className={`fixed inset-0 ${
        theme === "japanese" ? "bg-white" : "bg-black"
      }`}
    >
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <TimelineControls
        theme={theme}
        isPlaying={isPlaying}
        setIsPlaying={(playing) => dispatch({ type: "TOGGLE_PLAYING" })}
        volume={volume}
        setVolume={(vol) => dispatch({ type: "SET_VOLUME", payload: vol })}
        onPrevious={() => dispatch({ type: "PREVIOUS_IMAGE" })}
        onNext={() => dispatch({ type: "NEXT_IMAGE" })}
        canGoPrevious={currentIndex > 0}
        canGoNext={currentIndex < allImages.length - 1}
        currentTrack='"Hopes and Dreams" by Papa'
      />
    </div>
  );
};

export default TimelineView;
