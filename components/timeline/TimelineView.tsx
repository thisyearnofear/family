import { useEffect, useState, useMemo } from "react";
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

const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
];

const TimelineView: React.FC<TimelineViewProps> = ({ onComplete }) => {
  const { state, dispatch } = useTimeline();
  const { currentIndex, isPlaying, volume, groupedImages, theme } = state;
  const [isAutoHighlighting, setIsAutoHighlighting] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  // Compute all images first
  const allImages = useMemo(
    () => groupedImages.flatMap((group) => group.images),
    [groupedImages]
  );

  // Compute current track and month information
  const currentTrack = `"${SONGS[currentSongIndex].title}" by Papa`;

  const { currentMonth, showNextMonth, showPreviousMonth } = useMemo(() => {
    const monthIndex = groupedImages.findIndex((group) =>
      group.images.some((img) => img === allImages[currentIndex])
    );
    return {
      currentMonth: groupedImages[monthIndex]?.month || "",
      showNextMonth: monthIndex < groupedImages.length - 1,
      showPreviousMonth: monthIndex > 0,
    };
  }, [groupedImages, currentIndex, allImages]);

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

  const handleNextMonth = () => {
    const nextIndex =
      groupedImages.findIndex((group) =>
        group.images.some((img) => img === allImages[currentIndex])
      ) + 1;
    if (nextIndex < groupedImages.length) {
      dispatch({
        type: "SET_INDEX",
        payload: allImages.indexOf(groupedImages[nextIndex].images[0]),
      });
    }
  };

  const handlePreviousMonth = () => {
    const prevIndex =
      groupedImages.findIndex((group) =>
        group.images.some((img) => img === allImages[currentIndex])
      ) - 1;
    if (prevIndex >= 0) {
      dispatch({
        type: "SET_INDEX",
        payload: allImages.indexOf(groupedImages[prevIndex].images[0]),
      });
    }
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
        currentTrack={currentTrack}
        currentMonth={currentMonth}
        onNextMonth={handleNextMonth}
        onPreviousMonth={handlePreviousMonth}
        showNextMonth={showNextMonth}
        showPreviousMonth={showPreviousMonth}
        isAutoHighlighting={isAutoHighlighting}
        setIsAutoHighlighting={setIsAutoHighlighting}
        firstView={false}
        nextMonthLoadingProgress={0}
        onNextTrack={() =>
          setCurrentSongIndex((prev) => (prev + 1) % SONGS.length)
        }
        onPreviousTrack={() =>
          setCurrentSongIndex(
            (prev) => (prev - 1 + SONGS.length) % SONGS.length
          )
        }
      />
    </div>
  );
};

export default TimelineView;
