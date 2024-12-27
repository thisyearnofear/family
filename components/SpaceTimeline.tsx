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
import * as THREE from "three";
import Collage from "./Collage";

interface SpaceTimelineProps {
  images: ImageProps[];
}

const SpaceTimeline: React.FC<SpaceTimelineProps> = ({ images = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showStoryMode, setShowStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const targetCameraZRef = useRef(5);

  const introTexts = [
    "Welcome to a special journey through time and space...",
    "A collection of cherished memories, captured in the stars...",
    "Each photo tells a story of love, laughter, and togetherness...",
    "Let's explore these moments together...",
  ];

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

  // Update ThreeJS setup and animation
  useEffect(() => {
    if (!containerRef.current) return;

    // Store ref value in variable for cleanup
    const currentRef = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    currentRef.appendChild(renderer.domElement);

    // Stars setup with different layers for parallax effect
    const createStarLayer = (count: number, size: number, depth: number) => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size,
        transparent: true,
        opacity: Math.min(1, depth * 0.5),
      });

      const vertices = [];
      for (let i = 0; i < count; i++) {
        vertices.push(
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000,
          -Math.random() * depth
        );
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      return new THREE.Points(geometry, material);
    };

    const starLayers = [
      createStarLayer(5000, 0.15, 1000),
      createStarLayer(5000, 0.1, 1500),
      createStarLayer(5000, 0.05, 2000),
    ];

    starLayers.forEach((layer) => scene.add(layer));

    // Camera position
    camera.position.z = targetCameraZRef.current;

    // Animation
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Rotate star layers at different speeds
      starLayers.forEach((layer, index) => {
        layer.rotation.x += 0.0001 * (index + 1);
        layer.rotation.y += 0.0002 * (index + 1);
      });

      // Camera movement during intro
      if (showIntro) {
        targetCameraZRef.current -= 0.1;
        if (targetCameraZRef.current < -200) {
          targetCameraZRef.current = 5;
        }
        camera.position.z = targetCameraZRef.current;
      } else if (showStoryMode) {
        // Smooth camera movement for story mode
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 100, 0.02);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle intro text sequence
    if (showIntro) {
      const textInterval = setInterval(() => {
        setCurrentTextIndex((prev) => {
          if (prev >= introTexts.length - 1) {
            clearInterval(textInterval);
            setTimeout(() => {
              setShowIntro(false);
              setShowStoryMode(true);
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);

      return () => clearInterval(textInterval);
    }

    // Cleanup
    return () => {
      if (currentRef?.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [showIntro, introTexts.length, showStoryMode]);

  // Story mode content
  const StoryContent = () => {
    const allImages = groupedImages.flatMap((group) => group.images);
    const currentImage = allImages[storyIndex];
    const isLastImage = storyIndex === allImages.length - 1;

    console.log("Story Mode Debug:", {
      totalImages: allImages.length,
      currentIndex: storyIndex,
      currentImage,
      showStoryMode,
      isLastImage,
    });

    if (isLastImage) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center p-8"
          style={{ zIndex: 40 }}
        >
          <h2 className="text-4xl font-bold text-white mb-8">
            Your Year in Photos
          </h2>
          <div className="w-full max-w-6xl overflow-auto">
            <Collage images={allImages} />
          </div>
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStoryIndex(0)}
              className="px-6 py-3 bg-black/70 hover:bg-blue-900/70 rounded-lg text-white transition-colors border border-blue-500/30 backdrop-blur-sm"
            >
              Start Over
            </button>
            <button
              onClick={() => {
                /* TODO: Implement create gift flow */
              }}
              className="px-6 py-3 bg-blue-600/70 hover:bg-blue-700/70 rounded-lg text-white transition-colors border border-blue-500/30 backdrop-blur-sm"
            >
              Create Your Own Gift
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={storyIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 40 }}
        >
          <div className="relative w-full max-w-3xl h-full max-h-[80vh] pointer-events-auto p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg transform -rotate-1" />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg transform rotate-1" />
            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-blue-500/30">
              <Image
                src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${currentImage.ipfsHash}`}
                alt={currentImage.dateTaken || "Memory"}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
                onLoad={() =>
                  console.log("Image loaded:", currentImage.ipfsHash)
                }
                onError={(e) => console.error("Image load error:", e)}
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
            >
              <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg border border-blue-500/30">
                <p className="text-2xl font-bold text-blue-400">
                  {new Date(currentImage.dateTaken || "").toLocaleDateString(
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
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 10 }}
      />

      {/* Overlay content */}
      <div className="relative" style={{ zIndex: 20 }}>
        {showIntro && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 30 }}
          >
            <motion.div
              key={currentTextIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
              className="text-center px-4 max-w-4xl mx-auto"
            >
              <div className="bg-black/50 backdrop-blur-sm rounded-lg py-8 px-6 border border-blue-500/30">
                <p className="text-3xl md:text-4xl text-white font-bold">
                  {introTexts[currentTextIndex]}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {showStoryMode && (
          <div className="relative" style={{ zIndex: 30 }}>
            <StoryContent />

            {/* Navigation controls */}
            <div
              className="fixed bottom-16 left-1/2 -translate-x-1/2 flex gap-4"
              style={{ zIndex: 50 }}
            >
              <button
                onClick={() => {
                  console.log("Previous clicked, current index:", storyIndex);
                  if (storyIndex > 0) {
                    setStoryIndex(storyIndex - 1);
                  }
                }}
                className="px-6 py-3 bg-black/70 hover:bg-blue-900/70 rounded-lg text-white transition-colors border border-blue-500/30 backdrop-blur-sm disabled:opacity-50"
                disabled={storyIndex === 0}
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const allImages = groupedImages.flatMap(
                    (group) => group.images
                  );
                  console.log(
                    "Next clicked, current index:",
                    storyIndex,
                    "total images:",
                    allImages.length
                  );
                  if (storyIndex < allImages.length - 1) {
                    setStoryIndex(storyIndex + 1);
                  }
                }}
                className="px-6 py-3 bg-black/70 hover:bg-blue-900/70 rounded-lg text-white transition-colors border border-blue-500/30 backdrop-blur-sm group"
                disabled={
                  storyIndex ===
                  groupedImages.flatMap((group) => group.images).length - 1
                }
              >
                <span className="flex items-center gap-2">
                  Next
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Music controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed top-4 right-8"
          style={{ zIndex: 60 }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-blue-900/50 rounded-full transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6 text-white" />
              ) : (
                <PlayIcon className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-blue-500"
            />
            {volume === 0 ? (
              <VolumeOffIcon className="w-6 h-6 text-white" />
            ) : (
              <VolumeUpIcon className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="text-blue-200 text-sm">
            Now Playing: &quot;Hopes and Dreams&quot; by Papa
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceTimeline;
