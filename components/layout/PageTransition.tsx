import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  isPresent: boolean;
  theme?: "space" | "japanese";
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isPresent,
  theme,
}) => {
  const variants = {
    initial: {
      opacity: 0,
      ...(theme === "space" ? { scale: 1.1 } : { y: 20, filter: "blur(10px)" }),
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      ...(theme === "space"
        ? { scale: 0.9 }
        : { y: -20, filter: "blur(10px)" }),
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isPresent && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          className="fixed inset-0"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
