import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import * as THREE from "three";
import MonthlyView from "./MonthlyView";
import TimelineControls from "./TimelineControls";
import type { ImageProps } from "@utils/types/types";

interface SpaceTimelineProps {
  images: ImageProps[];
  isAutoHighlighting: boolean;
  setIsAutoHighlighting: (value: boolean) => void;
}

interface MonthData {
  key: string;
  month: string;
  images: ImageProps[];
  startIndex: number;
}

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    loadedCount: number;
    totalCount: number;
  };
}

const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
];

const SpaceTimeline: React.FC<SpaceTimelineProps> = ({
  images,
  isAutoHighlighting,
  setIsAutoHighlighting,
}) => {
  console.log("SpaceTimeline Component Mounted", {
    imagesCount: images?.length,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const targetCameraZRef = useRef(5);

  useEffect(() => {
    console.log("SpaceTimeline Effect Running", {
      showIntro,
      currentIndex,
      loadingStatesCount: Object.keys(loadingStates).length,
    });
  }, [showIntro, currentIndex, loadingStates]);

  // Group images by month for loading state tracking
  const monthlyData = useMemo(() => {
    const months: MonthData[] = [];
    let currentStartIndex = 0;

    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateTaken || !b.dateTaken) return 0;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
    });

    sortedImages.forEach((image) => {
      if (!image.dateTaken) return;

      const date = new Date(image.dateTaken);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const lastMonth = months[months.length - 1];
      if (lastMonth && lastMonth.key === monthKey) {
        if (lastMonth.images.length < 10) {
          lastMonth.images.push(image);
        }
      } else {
        months.push({
          key: monthKey,
          month: monthName,
          images: [image],
          startIndex: currentStartIndex,
        });
      }
      currentStartIndex++;
    });

    return months;
  }, [images]);

  // Find current month and next month
  const currentMonthIndex = monthlyData.findIndex(
    (month) =>
      currentIndex >= month.startIndex &&
      currentIndex < month.startIndex + month.images.length
  );

  const currentMonth = monthlyData[currentMonthIndex];
  const nextMonth = monthlyData[currentMonthIndex + 1];

  // Calculate next month loading progress
  const nextMonthLoadingProgress = useMemo(() => {
    if (!nextMonth || !loadingStates[nextMonth.key]) return 0;
    const { loadedCount, totalCount } = loadingStates[nextMonth.key];
    return Math.round((loadedCount / totalCount) * 100);
  }, [nextMonth, loadingStates]);

  const introTexts = [
    "Family is constant — gravity's centre, anchor in the cosmos.",
    "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
    "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
    "Love is infinite. Happiness innate. Seeing, believing ....",
  ];

  // Sound setup with proper cleanup
  const [play, { pause, sound }] = useSound(SONGS[currentSongIndex].path, {
    volume,
    loop: false,
    interrupt: true,
    html5: true,
    onend: () => {
      // When song ends naturally, move to next song
      if (isPlaying) {
        setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
      }
    },
  });

  // Keep track of current sound instance
  useEffect(() => {
    return () => {
      // Cleanup previous sound when unmounting or changing songs
      if (sound) {
        sound.unload();
      }
    };
  }, [sound]);

  // Handle song changes
  const handleNextTrack = useCallback(() => {
    if (sound) {
      sound.unload(); // Properly unload the current sound
    }
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
  }, [sound]);

  const handlePreviousTrack = useCallback(() => {
    if (sound) {
      sound.unload(); // Properly unload the current sound
    }
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  }, [sound]);

  // Handle play/pause
  useEffect(() => {
    if (!sound) return;

    if (isPlaying) {
      sound.play();
    } else {
      sound.pause();
    }

    return () => {
      sound.pause();
    };
  }, [isPlaying, sound]);

  // Handle volume changes
  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [volume, sound]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || showIntro) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          setIsPlaying(false);
          return images.length - 1; // Ensure we stay at the last image
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, showIntro, images.length]);

  // ThreeJS setup and animation
  useEffect(() => {
    if (!containerRef.current) return;

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

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

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

      // Camera movement
      if (showIntro) {
        targetCameraZRef.current -= 0.1;
        if (targetCameraZRef.current < -200) {
          targetCameraZRef.current = 5;
        }
        camera.position.z = targetCameraZRef.current;
      } else {
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
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [showIntro, introTexts.length]);

  // Handle month navigation
  const handleNextMonth = useCallback(() => {
    if (currentMonthIndex === monthlyData.length - 1) {
      // If we're at the last month, go to the last image
      setCurrentIndex(images.length - 1);
      return;
    }
    if (!nextMonth) return;
    setCurrentIndex(nextMonth.startIndex);
  }, [nextMonth, currentMonthIndex, monthlyData.length, images.length]);

  const handlePreviousMonth = useCallback(() => {
    const prevMonthIndex = currentMonthIndex - 1;
    if (prevMonthIndex < 0) return;
    setCurrentIndex(monthlyData[prevMonthIndex].startIndex);
  }, [currentMonthIndex, monthlyData]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background layer */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        {showIntro ? (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 2 }}
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
        ) : (
          <>
            <MonthlyView
              images={images}
              currentIndex={currentIndex}
              onImageClick={setCurrentIndex}
              theme="space"
              loadingStates={loadingStates}
              setLoadingStates={setLoadingStates}
              isAutoHighlighting={isAutoHighlighting}
              setIsAutoHighlighting={setIsAutoHighlighting}
            />

            {/* Controls layer - only shown after intro */}
            <TimelineControls
              theme="space"
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              volume={volume}
              setVolume={setVolume}
              currentTrack={`"${SONGS[currentSongIndex].title}" by Papa`}
              firstView={showIntro}
              nextMonthLoadingProgress={nextMonthLoadingProgress}
              onNextTrack={handleNextTrack}
              onPreviousTrack={handlePreviousTrack}
              currentMonth={currentMonth?.month}
              onNextMonth={handleNextMonth}
              onPreviousMonth={handlePreviousMonth}
              showNextMonth={
                !!nextMonth && !loadingStates[nextMonth.key]?.isLoading
              }
              showPreviousMonth={currentMonthIndex > 0}
              isAutoHighlighting={isAutoHighlighting}
              setIsAutoHighlighting={setIsAutoHighlighting}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SpaceTimeline;
