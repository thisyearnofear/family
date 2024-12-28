import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useTimeline } from "../../contexts/TimelineContext";
import { AnimatedContainer } from "../layout/AnimatedContainer";
import MemoryImage from "../media/MemoryImage";
import TimelineControls from "./TimelineControls";
import MonthlyCollage from "../ui/MonthlyCollage";
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
              images={allImages}
              onImageClick={(index) => {
                if (index !== -1) {
                  dispatch({ type: "SET_INDEX", payload: index });
                }
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
            images={currentGroup.images}
            onImageClick={(index) => {
              const globalIndex = allImages.findIndex(
                (img) => img === currentGroup.images[index]
              );
              if (globalIndex !== -1) {
                dispatch({ type: "SET_INDEX", payload: globalIndex });
              }
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
          <MemoryImage
            image={currentImage}
            priority={true}
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
        currentTrack='"Hopes and Dreams" by Papa'
        currentMonth={currentGroup?.month}
        onNextMonth={() => {
          const nextGroupIndex = currentMonthIndex + 1;
          if (nextGroupIndex < groupedImages.length) {
            dispatch({
              type: "SET_INDEX",
              payload: groupedImages[nextGroupIndex].images[0].id,
            });
          }
        }}
        onPreviousMonth={() => {
          const prevGroupIndex = currentMonthIndex - 1;
          if (prevGroupIndex >= 0) {
            dispatch({
              type: "SET_INDEX",
              payload: groupedImages[prevGroupIndex].images[0].id,
            });
          }
        }}
        showNextMonth={currentMonthIndex < groupedImages.length - 1}
        showPreviousMonth={currentMonthIndex > 0}
      />
    </div>
  );
};

export default TimelineView;
