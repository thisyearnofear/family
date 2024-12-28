import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface SpaceIntroProps {
  onComplete: () => void;
}

const SpaceIntro: React.FC<SpaceIntroProps> = ({ onComplete }) => {
  console.log("SpaceIntro Component Mounted");

  const containerRef = useRef<HTMLDivElement>(null);
  const [showText, setShowText] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const introTexts = [
    "Family is constant — gravity's centre, anchor in the cosmos.",
    "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
    "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
    "Love is infinite. Happiness innate. Seeing, believing ....",
  ];

  useEffect(() => {
    console.log("SpaceIntro Effect Running", {
      showText,
      currentTextIndex,
    });

    if (!containerRef.current) {
      console.log("Container ref not ready");
      return;
    }

    console.log("Initializing Three.js scene");

    // Store ref value in variable for cleanup
    const currentRef = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
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

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
    });

    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = -Math.random() * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Camera position
    camera.position.z = 5;

    // Animation
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Rotate stars
      stars.rotation.x += 0.0001;
      stars.rotation.y += 0.0002;

      // Move camera forward
      camera.position.z -= 0.1;

      // Reset camera position when too close
      if (camera.position.z < -200) {
        camera.position.z = 5;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Start text sequence
    setShowText(true);

    // Cleanup
    return () => {
      if (currentRef?.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []); // Empty dependency array since this is the initial setup

  // Separate effect for text transitions
  useEffect(() => {
    if (!showText) return;

    const timer = setTimeout(() => {
      if (currentTextIndex >= introTexts.length - 1) {
        setShowText(false);
        setTimeout(onComplete, 2000);
      } else {
        setCurrentTextIndex((prev) => prev + 1);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentTextIndex, showText]);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <AnimatePresence mode="wait">
        {showText && (
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 flex items-center justify-center px-4 z-10"
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-lg py-8 px-6 border border-blue-500/30">
              <p className="text-3xl md:text-4xl text-white font-bold">
                {introTexts[currentTextIndex]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button - always visible */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-8 right-8 px-6 py-3 rounded-full bg-blue-600/70 hover:bg-blue-700/70 text-white backdrop-blur-sm border border-blue-500/30 transition-all hover:scale-105 z-20"
        onClick={() => {
          setShowText(false);
          onComplete();
        }}
      >
        Skip Intro →
      </motion.button>
    </div>
  );
};

export default SpaceIntro;
