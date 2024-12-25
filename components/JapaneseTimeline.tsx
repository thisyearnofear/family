import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
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

interface JapaneseTimelineProps {
  images: ImageProps[];
}

const JapaneseTimeline: React.FC<JapaneseTimelineProps> = ({ images = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showStoryMode, setShowStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
  });

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

  // Intro sequence
  if (showIntro) {
    return (
      <motion.div className="fixed inset-0 bg-white text-stone-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/2">
            🌸
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64 translate-y-1/2 -translate-x-1/2">
            🎋
          </div>
        </div>
        <div className="relative w-full h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center max-w-2xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-7xl mb-8 font-japanese text-red-600"
              >
                禅
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="w-16 h-0.5 bg-red-600 mx-auto mb-8"
              />
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-4xl mb-4 font-japanese"
              >
                A Gift of Memories
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="text-xl text-stone-600 mb-12 leading-relaxed"
              >
                Take a peaceful journey through our cherished moments together.
                Each memory is a stepping stone in our shared garden of time.
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                onClick={() => {
                  setShowIntro(false);
                  setShowStoryMode(true);
                }}
                className="px-8 py-4 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-900 transition-colors border border-stone-200 shadow-sm group"
              >
                <span className="flex items-center gap-3">
                  Begin Your Journey
                  <span className="group-hover:rotate-12 transition-transform">
                    🌳
                  </span>
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Story mode
  if (showStoryMode) {
    const allImages = groupedImages.flatMap((group) => group.images);
    const currentImage = allImages[storyIndex];

    return (
      <div className="fixed inset-0 bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={storyIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            {currentImage && (
              <div className="relative w-full h-full">
                <Image
                  src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${currentImage.ipfsHash}`}
                  alt={currentImage.dateTaken || "Memory"}
                  fill
                  className="object-contain p-8"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white pointer-events-none" />
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-2xl font-japanese mb-4 text-stone-800">
                    {new Date(currentImage.dateTaken || "").toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <div className="w-12 h-0.5 bg-red-600 mx-auto" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          <button
            onClick={() => {
              if (storyIndex > 0) {
                setStoryIndex(storyIndex - 1);
              }
            }}
            className="px-6 py-3 bg-white hover:bg-stone-50 rounded-lg text-stone-900 transition-colors border border-stone-200 shadow-sm disabled:opacity-50"
            disabled={storyIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (storyIndex < allImages.length - 1) {
                setStoryIndex(storyIndex + 1);
              } else {
                setShowStoryMode(false);
              }
            }}
            className="px-6 py-3 bg-white hover:bg-stone-50 rounded-lg text-stone-900 transition-colors border border-stone-200 shadow-sm group"
          >
            {storyIndex < allImages.length - 1 ? (
              <span className="flex items-center gap-2">
                Next
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </span>
            ) : (
              "View All Memories"
            )}
          </button>
        </div>

        {/* Music controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 right-8 z-50 bg-white/90 backdrop-blur-lg rounded-lg p-4 flex items-center gap-4 border border-stone-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
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
          <div className="text-stone-600 text-sm font-japanese">
            Now Playing: "Hopes and Dreams" by Papa
          </div>
        </motion.div>
      </div>
    );
  }

  // Timeline view
  return (
    <div ref={containerRef} className="relative min-h-screen py-20 bg-white">
      {/* Music Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-8 right-8 z-50 bg-white/90 backdrop-blur-lg rounded-lg p-4 flex items-center gap-4 border border-stone-200 shadow-sm"
      >
        <div className="flex items-center gap-2">
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
        <div className="text-stone-600 text-sm font-japanese">
          Now Playing: "Hopes and Dreams" by Papa
        </div>
      </motion.div>

      {/* Timeline Content */}
      <div className="relative z-10">
        <motion.div
          className="max-w-7xl mx-auto px-4"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [0.3, 1]) }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {groupedImages.map((group, groupIndex) => (
            <motion.section
              key={group.month}
              className="timeline-section mb-20"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-12 relative">
                <h2 className="month-title text-5xl font-japanese text-stone-800 relative inline-block">
                  {group.month}
                  <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform" />
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.images.map((image) => (
                  <div
                    key={image.id}
                    className="photo-container relative aspect-[3/2] rounded-lg overflow-hidden group hover:z-10"
                  >
                    <div className="w-full h-full">
                      <Image
                        alt={image.dateTaken || "Memory"}
                        className="transform rounded-lg brightness-100 transition will-change-auto group-hover:brightness-105 group-hover:scale-105 duration-700 object-cover"
                        style={{ transform: "translate3d(0, 0, 0)" }}
                        src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
                        fill
                        sizes="(max-width: 640px) 100vw,
                               (max-width: 1280px) 50vw,
                               (max-width: 1536px) 33vw,
                               25vw"
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <div className="absolute bottom-4 left-4 text-stone-800">
                          <p className="text-sm font-japanese">
                            {new Date(image.dateTaken || "").toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default JapaneseTimeline;
