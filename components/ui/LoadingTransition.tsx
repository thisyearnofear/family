import { motion } from "framer-motion";
import React from "react";

interface LoadingTransitionProps {
  theme: "space" | "japanese";
  mode: "edit" | "unwrap";
}

export function LoadingTransition({
  theme,
  mode,
}: LoadingTransitionProps): React.ReactElement {
  const isSpace = theme === "space";

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.2, duration: 0.5, ease: "easeOut" },
  };

  return (
    <motion.div
      {...containerVariants}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isSpace ? "bg-black" : "bg-white"
      }`}
    >
      <div className="text-center">
        <motion.div {...iconVariants} className="mb-6">
          <span className="text-5xl">{isSpace ? "🚀" : "🌳"}</span>
        </motion.div>
        <motion.div
          {...textVariants}
          className={`text-xl ${
            isSpace ? "text-white font-space" : "text-stone-800 font-japanese"
          }`}
        >
          {isSpace ? "Preparing for launch..." : "Opening the garden..."}
        </motion.div>
      </div>
    </motion.div>
  );
}
