import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const ZenBackground = dynamic(() => import("./ZenBackground"), { ssr: false });

interface JapaneseIntroProps {
  onComplete: () => void;
}

const JapaneseIntro: React.FC<JapaneseIntroProps> = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const introTexts = [
    "Welcome to a journey through tranquil memories...",
    "Each moment captured, like ripples in a zen garden...",
    "A collection of our shared experiences, preserved in time...",
    "Let's explore these peaceful moments together...",
  ];

  useEffect(() => {
    setShowText(true);
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev >= introTexts.length - 1) {
          clearInterval(textInterval);
          setTimeout(() => {
            onComplete();
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(textInterval);
  }, [onComplete, introTexts.length]);

  return (
    <div className="fixed inset-0 bg-white">
      <ZenBackground mode="intro" />
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
          className="text-center px-4 relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-lg py-8 px-16 shadow-lg">
            <p className="text-3xl md:text-4xl text-stone-800 font-japanese">
              {introTexts[currentTextIndex]}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default JapaneseIntro;
