import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const ZenBackground = dynamic(() => import("./ZenBackground"), { ssr: false });

interface JapaneseIntroProps {
  onComplete: () => void;
}

const JapaneseIntro: React.FC<JapaneseIntroProps> = ({ onComplete }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const introTexts = [
    "Family is constant — gravity's centre, anchor in the cosmos.",
    "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
    "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
    "Love is infinite. Happiness innate. Seeing, believing ....",
  ];

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

  return (
    <div className="fixed inset-0 bg-white">
      <ZenBackground mode="intro" />

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
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.p
              className="text-3xl md:text-4xl text-stone-800 font-japanese"
              style={{
                textShadow: "0 0 20px rgba(255, 255, 255, 0.8)",
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
        className="fixed bottom-8 right-8 px-6 py-3 rounded-full bg-stone-900/10 hover:bg-stone-900/20 backdrop-blur-sm text-stone-900 font-medium transition-colors"
      >
        Skip Intro →
      </motion.button>
    </div>
  );
};

export default JapaneseIntro;
