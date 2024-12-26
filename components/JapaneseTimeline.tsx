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
import Collage from "./Collage";

// SVG paths for zen elements
const ZEN_ELEMENTS = {
  enso: "M50,25 A25,25 0 1,1 75,50 A25,25 0 1,1 50,25", // Zen circle
  kanji1: "M30,20 L70,20 M50,20 L50,80 M30,50 L70,50", // 中 (center)
  bamboo:
    "M50,10 L50,90 M45,20 L55,20 M45,40 L55,40 M45,60 L55,60 M45,80 L55,80",
  wave: "M10,50 Q30,40 50,50 T90,50", // Japanese wave pattern
  rock: "M30,70 Q50,50 70,70", // Zen garden rock line
};

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

  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.3, 1]);

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

  // Story mode content
  const StoryContent = () => {
    const allImages = groupedImages.flatMap((group) => group.images);
    const currentImage = allImages[storyIndex];
    const isLastImage = storyIndex === allImages.length - 1;

    console.log("Story Mode Debug:", {
      totalImages: allImages.length,
      currentIndex: storyIndex,
      currentImage,
      isLastImage,
    });

    if (isLastImage) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 40 }}
        >
          <h2 className="text-4xl font-japanese text-white mb-8 relative z-50">
            思い出の一年
            <span className="block text-lg mt-2 text-white/80">
              A Year of Memories
            </span>
          </h2>
          <div className="w-full max-w-6xl overflow-auto p-8 bg-black/20 backdrop-blur-md rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allImages.map((image, index) => (
                <motion.div
                  key={image.ipfsHash}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1 },
                  }}
                  className="relative aspect-[3/2] group"
                >
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded transform -rotate-1" />
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded transform rotate-1" />
                  <div className="relative w-full h-full rounded overflow-hidden border border-white/20">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
                      alt={image.dateTaken || "Memory"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-sm font-japanese">
                        {new Date(image.dateTaken || "").toLocaleDateString(
                          "ja-JP"
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStoryIndex(0)}
              className="px-6 py-3 bg-black/40 hover:bg-black/60 rounded-lg text-white transition-colors backdrop-blur-sm"
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
        style={{ zIndex: 40 }}
      >
        <div className="relative w-full max-w-4xl h-full max-h-[80vh] p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg transform -rotate-1" />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg transform rotate-1" />
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/20">
            {currentImage && (
              <Image
                src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${currentImage.ipfsHash}`}
                alt={currentImage.dateTaken || "Memory"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-50"
          >
            <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
              <p className="text-2xl font-japanese text-white">
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

  // Add canvas setup for Seigaiha pattern
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.id = "seigaiha-pattern";
    canvas.className = "absolute inset-0 w-full h-full";
    canvas.style.mixBlendMode = "multiply";
    canvas.style.opacity = "0.8";
    canvas.style.backgroundColor = "white";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    containerRef.current?.appendChild(canvas);

    const radius = 40;
    const iterationsX = Math.ceil(width / radius / 2) + 2;
    const iterationsY = Math.ceil(height / radius) + 2;
    const xGap = radius * 2;
    const yGap = radius * 1.5;

    ctx.strokeStyle = "#E5E7EB"; // Light gray for strokes
    ctx.lineWidth = 1;

    const makeCircle = (x: number, y: number, radius: number) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const makeCircles = (x: number, y: number, radius: number) => {
      // Base circle with light blue fill
      ctx.fillStyle = "#F3F4F6"; // Very light gray-blue
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner circles with decreasing sizes
      const innerRadii = [0.8, 0.6, 0.4, 0.2];
      innerRadii.forEach((scale) => {
        makeCircle(x, y, radius * scale);
      });

      // Add a subtle red accent occasionally
      if (Math.random() < 0.05) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.1)"; // Very light red
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw the pattern
    for (let row = 0; row < iterationsY; row++) {
      const isEvenRow = row % 2 === 0;
      const xOffset = isEvenRow ? radius : 0;

      for (let col = -1; col < iterationsX; col++) {
        const x = col * xGap + xOffset;
        const y = row * yGap;
        makeCircles(x, y, radius);
      }
    }

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redraw pattern on resize
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let row = 0; row < iterationsY; row++) {
        const isEvenRow = row % 2 === 0;
        const xOffset = isEvenRow ? radius : 0;

        for (let col = -1; col < iterationsX; col++) {
          const x = col * xGap + xOffset;
          const y = row * yGap;
          makeCircles(x, y, radius);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, []);

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
    return (
      <div className="fixed inset-0 bg-white">
        <div
          ref={containerRef}
          className="absolute inset-0 bg-white"
          style={{ zIndex: 10 }}
        >
          <canvas
            id="seigaiha-pattern"
            className="absolute inset-0 w-full h-full"
            style={{
              mixBlendMode: "multiply",
              opacity: 0.8,
              backgroundColor: "white",
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={storyIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            {StoryContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
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
              const allImages = groupedImages.flatMap((group) => group.images);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed top-4 right-8 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 border border-stone-200"
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
          style={{ opacity }}
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
                              "ja-JP"
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
