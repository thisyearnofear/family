import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

interface WelcomeScreenProps {
  onThemeSelect: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onThemeSelect }) => {
  const { setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto px-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          A Gift of Memories
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Welcome to a special journey through our shared moments. Choose your
          preferred experience below to begin exploring our memories together.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTheme("space");
              onThemeSelect();
            }}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 p-[2px]"
          >
            <div className="relative rounded-lg bg-black px-8 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">
                  Space Journey
                </span>
                <span className="text-2xl">🚀</span>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTheme("japanese");
              onThemeSelect();
            }}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-red-600 to-pink-700 p-[2px]"
          >
            <div className="relative rounded-lg bg-black px-8 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">Zen Garden</span>
                <span className="text-2xl">🌳</span>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-600 to-pink-700 opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
