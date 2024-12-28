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
    "Welcome to a special journey through memories...",
    "A collection of cherished moments, captured in time...",
    "Each photo tells a story of love and connection...",
    "Let's explore these moments together...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev >= introTexts.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [introTexts.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-white">
      <ZenBackground mode="intro" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTextIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 flex items-center justify-center px-4"
        >
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-3xl md:text-4xl text-stone-800 font-japanese">
              {introTexts[currentTextIndex]}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default JapaneseIntro;
