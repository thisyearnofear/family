import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import type { ImageProps } from "../utils/types";
import useSound from "use-sound";
import {
  SpeakerWaveIcon as VolumeUpIcon,
  SpeakerXMarkIcon as VolumeOffIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import Collage from "./Collage";
import * as THREE from "three";
import dynamic from "next/dynamic";

const JapaneseIntro = dynamic(() => import("./JapaneseIntro"), { ssr: false });
const ZenBackground = dynamic(() => import("./ZenBackground"), { ssr: false });

interface JapaneseTimelineProps {
  images: ImageProps[];
  theme?: "space" | "japanese";
}

const JapaneseTimeline: React.FC<JapaneseTimelineProps> = ({
  images = [],
  theme = "japanese",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showStoryMode, setShowStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);

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

  // Group images by month
  const groupedImages = useMemo(() => {
    if (!images || !Array.isArray(images)) return [];

    return images.reduce(
      (groups: { month: string; images: ImageProps[] }[], image) => {
        if (!image.dateTaken) return groups;
        const month = new Date(image.dateTaken).toLocaleString("default", {
          month: "long",
        });
        const existingGroup = groups.find((g) => g.month === month);
        if (existingGroup) {
          existingGroup.images.push(image);
        } else {
          groups.push({ month, images: [image] });
        }
        return groups;
      },
      []
    );
  }, [images]);

  // Handle intro completion
  const handleIntroComplete = () => {
    setShowIntro(false);
    setShowStoryMode(true);
  };

  // Story mode content
  const StoryContent = () => {
    const allImages = groupedImages.flatMap((group) => group.images);
    const currentImage = allImages[storyIndex];
    const isLastImage = storyIndex === allImages.length - 1;

    if (isLastImage) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <h2 className="text-4xl font-japanese text-stone-800 mb-8 relative">
            思い出の一年
            <span className="block text-lg mt-2 text-stone-600">
              A Year of Memories
            </span>
          </h2>
          <div className="w-full max-w-6xl overflow-auto p-8 bg-white/50 backdrop-blur-sm rounded-lg">
            <Collage images={allImages} theme="japanese" />
          </div>
          <div className="mt-8 mb-32 flex gap-4">
            <button
              onClick={() => setStoryIndex(0)}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-800 transition-colors backdrop-blur-sm"
            >
              Start Over
            </button>
            <button
              onClick={() => {
                /* TODO: Implement create gift flow */
              }}
              className="px-6 py-3 bg-red-600/80 hover:bg-red-700/80 rounded-lg text-white transition-colors backdrop-blur-sm"
            >
              Create Your Own Gift
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={storyIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        <div className="relative w-full max-w-4xl h-full max-h-[80vh] p-4">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-lg transform -rotate-1" />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-lg transform rotate-1" />
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center bg-white/50">
            {currentImage && (
              <div className="relative w-[90%] h-[90%]">
                <Image
                  src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${currentImage.ipfsHash}`}
                  alt={currentImage.dateTaken || "Memory"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-50"
          >
            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-stone-200">
              <p className="text-2xl font-japanese text-stone-800">
                {new Date(currentImage?.dateTaken || "").toLocaleDateString(
                  "ja-JP"
                )}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // Render intro if showing
  if (showIntro) {
    return <JapaneseIntro onComplete={handleIntroComplete} />;
  }

  // Story mode
  if (showStoryMode) {
    return (
      <div className="fixed inset-0 bg-white">
        <ZenBackground mode="story" />
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">{StoryContent()}</AnimatePresence>

          {/* Navigation controls */}
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex gap-4 z-50">
            <button
              onClick={() => {
                if (storyIndex > 0) {
                  setStoryIndex(storyIndex - 1);
                }
              }}
              className="px-6 py-3 bg-white/80 hover:bg-white/90 rounded-lg text-stone-800 transition-colors backdrop-blur-sm border border-stone-200 disabled:opacity-50"
              disabled={storyIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={() => {
                const allImages = groupedImages.flatMap(
                  (group) => group.images
                );
                if (storyIndex < allImages.length - 1) {
                  setStoryIndex(storyIndex + 1);
                }
              }}
              className="px-6 py-3 bg-white/80 hover:bg-white/90 rounded-lg text-stone-800 transition-colors backdrop-blur-sm border border-stone-200 group"
            >
              <span className="flex items-center gap-2">
                Next
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </span>
            </button>
          </div>

          {/* Music controls */}
          <div className="fixed bottom-8 right-8 z-50">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-stone-200">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-stone-50 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6 text-stone-800" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-stone-800" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-red-500"
                />
                {volume === 0 ? (
                  <VolumeOffIcon className="w-6 h-6 text-stone-800" />
                ) : (
                  <VolumeUpIcon className="w-6 h-6 text-stone-800" />
                )}
              </div>
              <div className="text-stone-600 text-sm font-japanese text-right px-2">
                Now Playing: &quot;Hopes and Dreams&quot; by Papa
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JapaneseTimeline;
