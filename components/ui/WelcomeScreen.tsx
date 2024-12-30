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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
      >
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-['Big_Shoulders_Display'] text-gray-800 mb-6">
            FamilyWrapped
          </h1>
          <p className="text-lg text-gray-600 mb-12 max-w-lg mx-auto font-['Outfit']">
            Another year in the books <br /> Lets relive precious moments
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center mb-12">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTheme("space");
                onThemeSelect();
              }}
              className="group px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="block text-2xl mb-1">🚀</span>
              <span className="block text-lg font-['Big_Shoulders_Display'] text-gray-800">
                Space
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTheme("japanese");
                onThemeSelect();
              }}
              className="group px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="block text-2xl mb-1">🌳</span>
              <span className="block text-lg font-['Big_Shoulders_Display'] text-gray-800">
                Zen
              </span>
            </motion.button>
          </div>

          <div className="max-w-sm mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
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
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                  // Handle gift unwrapping here
                }
              }}
            >
              Unwrap Gift
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-300"
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
