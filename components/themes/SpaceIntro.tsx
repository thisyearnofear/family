import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

interface SpaceIntroProps {
  onComplete: () => void;
  messages?: string[];
}

const SpaceIntro: React.FC<SpaceIntroProps> = ({
  onComplete,
  messages = [],
}) => {
  console.log("🌟 SpaceIntro mounted with messages:", messages);

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const introTexts =
    messages.length > 0
      ? messages
      : [
          "Family is constant — gravity's centre, anchor in the cosmos.",
          "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
          "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
          "Love is infinite. Happiness innate. Seeing, believing ....",
        ];

  console.log("🌟 Using texts:", {
    providedMessages: messages,
    usingDefaultTexts: messages.length === 0,
    finalTexts: introTexts,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev >= introTexts.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 6000);
          return prev;
        }
        return prev + 1;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [introTexts.length, onComplete]);

  // ThreeJS setup and animation
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

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
    camera.position.z = 5;

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
      camera.position.z = Math.max(-200, camera.position.z - 0.1);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (container?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      console.log("🌟 SpaceIntro unmounted");
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Background layer */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />

      {/* Content layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTextIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 1 }}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.p
              className="text-3xl md:text-4xl text-white font-space"
              style={{
                textShadow: "0 0 20px rgba(0, 0, 255, 0.5)",
              }}
            >
              {introTexts[currentTextIndex]}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Skip button - always visible */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={onComplete}
        className="fixed bottom-8 right-8 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium transition-colors"
        style={{ zIndex: 2 }}
      >
        Skip Intro →
      </motion.button>
    </div>
  );
};

export default SpaceIntro;
