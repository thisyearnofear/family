import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useState } from "react";
import Image from "next/image";

interface WelcomeScreenProps {
  onThemeSelect: () => void;
  onCreateGift: () => void;
}

const SOCIALS = [
  {
    icon: "/images/lens.svg",
    href: "https://hey.xyz/u/papajams",
    alt: "Lens Profile",
  },
  {
    icon: "/images/farcasterpurple.png",
    href: "https://warpcast.com/papa",
    alt: "Farcaster Profile",
  },
  {
    icon: "/images/paragraph.png",
    href: "https://paragraph.xyz/@papajams.eth",
    alt: "Paragraph Blog",
  },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onThemeSelect,
  onCreateGift,
}) => {
  const { setTheme } = useTheme();
  const [giftId, setGiftId] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-48 md:w-64 h-48 md:h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-16 left-1/3 w-48 md:w-64 h-48 md:h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen overflow-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md mx-auto flex flex-col"
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-['Big_Shoulders_Display'] text-gray-800 mb-4">
              FamilyWrapped
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-sm mx-auto font-['Outfit']">
              Another year in the books <br /> Collage family memories <br />
              Relive precious moments
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
                Space Demo
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
                Zen Demo
              </span>
            </motion.button>
          </div>

          {/* Create Gift Section */}
          <motion.div
            className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8 text-white"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl text-center font-['Big_Shoulders_Display'] mb-3">
              Create Memory
            </h2>
            <p className="text-sm mb-4 text-center text-white/90 font-['Outfit']">
              Add photos, write messages, share love.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateGift}
              className="w-full px-4 py-3 bg-white text-blue-600 rounded-xl hover:bg-white/90 transition-colors duration-300 font-semibold"
            >
              Start →
            </motion.button>
          </motion.div>

          {/* Gift ID Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-12">
            <h2 className="text-2xl text-center font-['Big_Shoulders_Display'] text-gray-800 mb-2">
              🎁
            </h2>

            <div className="relative">
              <input
                type="text"
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                placeholder="Enter gift ID"
                className="w-full px-4 py-3 mb-4 text-center bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Unwrap
            </motion.button>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center items-center gap-6 pb-8">
            {SOCIALS.map((social) => (
              <motion.a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 relative hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={social.icon}
                  alt={social.alt}
                  fill
                  className="object-contain"
                />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
