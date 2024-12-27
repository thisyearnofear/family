import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import * as THREE from "three";
import MonthlyView from "./MonthlyView";
import TimelineControls from "./TimelineControls";
import type { ImageProps } from "../utils/types";

interface SpaceTimelineProps {
  images: ImageProps[];
}

const SpaceTimeline: React.FC<SpaceTimelineProps> = ({ images = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Sound setup
  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
    interrupt: false,
    html5: true,
  });

  // Memoized play/pause handlers
  const handlePlay = useCallback(() => {
    try {
      play();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [play]);

  const handlePause = useCallback(() => {
    try {
      pause();
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }, [pause]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }
    return () => handlePause();
  }, [isPlaying, handlePlay, handlePause]);

  // Handle volume changes
  useEffect(() => {
    if (sound) {
      try {
        sound.volume(volume);
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    }
  }, [volume, sound]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || showIntro) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          return prev;
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 10 }}
      />

      {/* Overlay content */}
      <div className="relative" style={{ zIndex: 20 }}>
        {showIntro ? (
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
        ) : (
          <>
            <MonthlyView
              images={images}
              currentIndex={currentIndex}
              onImageClick={setCurrentIndex}
              theme="space"
            />

            <TimelineControls
              theme="space"
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              volume={volume}
              setVolume={setVolume}
              onPrevious={() =>
                setCurrentIndex((prev) => Math.max(0, prev - 1))
              }
              onNext={() =>
                setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1))
              }
              showPrevious={currentIndex > 0}
              showNext={currentIndex < images.length - 1}
              currentTrack='"Hopes and Dreams" by Papa'
              firstView={showIntro}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SpaceTimeline;
