import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useState } from "react";

interface WelcomeScreenProps {
  onThemeSelect: () => void;
  onCreateGift: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onThemeSelect,
  onCreateGift,
}) => {
  const { setTheme } = useTheme();
  const [giftId, setGiftId] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-48 md:w-64 h-48 md:h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-16 left-1/3 w-48 md:w-64 h-48 md:h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 py-12 md:py-20"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-['Big_Shoulders_Display'] text-gray-800 mb-4">
              FamilyWrapped
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-sm mx-auto font-['Outfit']">
              Another year in the books <br /> Lets relive precious moments
            </p>
          </div>

          <div className="flex flex-row justify-center gap-4 mb-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTheme("space");
                onThemeSelect();
              }}
              className="w-32 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="block text-2xl mb-1">🚀</span>
              <span className="block text-lg font-['Big_Shoulders_Display'] text-gray-800">
                Space
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTheme("japanese");
                onThemeSelect();
              }}
              className="w-32 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="block text-2xl mb-1">🌳</span>
              <span className="block text-lg font-['Big_Shoulders_Display'] text-gray-800">
                Zen
              </span>
            </motion.button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-['Big_Shoulders_Display'] text-gray-800 mb-4">
              Been Gifted?
            </h2>
            <div className="relative">
              <input
                type="text"
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                placeholder="Enter your gift ID"
                className="w-full px-4 py-3 mb-4 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {giftId && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setGiftId("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 min-h-0 min-w-0 p-2"
                >
                  ×
                </motion.button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!giftId.trim()}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (giftId.trim()) {
                  console.log("Unwrapping gift with ID:", giftId.trim());
                }
              }}
            >
              Unwrap Gift
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-center text-gray-600 hover:text-gray-800 transition-colors duration-300 py-2"
            onClick={onCreateGift}
          >
            Curate your own gift →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
