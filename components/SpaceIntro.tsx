import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

interface SpaceIntroProps {
  onComplete: () => void;
}

const SpaceIntro: React.FC<SpaceIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showText, setShowText] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const introTexts = [
    "Welcome to a special journey through time and space...",
    "A collection of cherished memories, captured in the stars...",
    "Each photo tells a story of love, laughter, and togetherness...",
    "Let's explore these moments together...",
  ];

  useEffect(() => {
    if (!containerRef.current) return;

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
    containerRef.current.appendChild(renderer.domElement);

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
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev >= introTexts.length - 1) {
          clearInterval(textInterval);
          setTimeout(() => {
            cancelAnimationFrame(frame);
            onComplete();
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    // Cleanup
    return () => {
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      clearInterval(textInterval);
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showText ? 1 : 0 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          key={currentTextIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1 }}
          className="text-center px-4"
        >
          <p className="text-3xl md:text-4xl text-white font-bold max-w-3xl mx-auto">
            {introTexts[currentTextIndex]}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SpaceIntro;