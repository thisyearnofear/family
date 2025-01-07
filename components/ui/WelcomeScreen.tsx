import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useState } from "react";
import Image from "next/image";
import { getImages } from "@utils/api/pinata";
import type { ImageProps } from "@utils/types/types";

interface WelcomeScreenProps {
  onCreateGift: () => void;
  onUnwrapGift: (
    images: ImageProps[],
    giftId: string,
    theme: "space" | "japanese",
    messages?: string[],
    music?: string[],
    title?: string
  ) => void;
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

const LoadingTransition = ({ theme }: { theme: "space" | "japanese" }) => {
  const isSpace = theme === "space";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isSpace ? "bg-black" : "bg-white"
      }`}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="text-5xl">{isSpace ? "🚀" : "🌳"}</span>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className={`text-xl ${
            isSpace ? "text-white font-space" : "text-stone-800 font-japanese"
          }`}
        >
          {isSpace ? "Preparing for launch..." : "Opening the garden..."}
        </motion.div>
      </div>
    </motion.div>
  );
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateGift,
  onUnwrapGift,
}) => {
  const { setTheme } = useTheme();
  const [giftId, setGiftId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTheme, setLoadingTheme] = useState<"space" | "japanese" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleDemoSelect = async (theme: "space" | "japanese") => {
    try {
      setLoadingTheme(theme);
      console.log("🚀 handleDemoSelect called:", { theme });

      const demoId =
        theme === "space"
          ? process.env.NEXT_PUBLIC_SPACE_DEMO_ID
          : process.env.NEXT_PUBLIC_JAPANESE_DEMO_ID;

      if (!demoId) {
        throw new Error(`No demo ID found for ${theme} theme`);
      }

      const { images, messages, music } = await getImages({
        groupId: demoId,
        hasFiles: false,
        hasIpfs: false,
        isDemo: false,
      });

      if (!images || images.length === 0) {
        throw new Error("No demo images found");
      }

      console.log("🚀 Demo content loaded:", {
        imageCount: images.length,
        messageCount: messages?.length,
        musicCount: music?.length,
      });

      // Set theme and transition to gift experience
      setTheme(theme);
      onUnwrapGift(images, demoId, theme, messages, music);
    } catch (error) {
      console.error("❌ Error loading demo:", error);
      setError("Failed to load demo experience");
      setLoadingTheme(null);
    }
  };

  const handleUnwrapGift = async (giftId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmedGiftId = giftId.trim();
      if (trimmedGiftId !== giftId) {
        console.warn(
          "Gift ID contained leading or trailing spaces. These have been removed."
        );
      }

      const data = await getImages({
        groupId: trimmedGiftId,
        hasFiles: true,
        hasIpfs: false,
        isDemo: false,
      });

      onUnwrapGift(
        data.images,
        trimmedGiftId,
        data.theme as "space" | "japanese",
        data.messages,
        data.music,
        data.title
      );
    } catch (error) {
      console.error("Error unwrapping gift:", error);
      setError(
        error instanceof Error ? error.message : "Failed to unwrap gift"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loadingTheme && <LoadingTransition theme={loadingTheme} />}
      </AnimatePresence>

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
              <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] text-gray-800/90 mb-4">
                FamilyWrapped
              </h1>
              <p className="text-base md:text-lg text-gray-600/90 max-w-sm mx-auto font-['Lora'] leading-relaxed">
                Another year in the books <br /> Collage family memories <br />
                Relive precious moments
              </p>
            </div>

            <div className="flex flex-row justify-center gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoSelect("space")}
                className="w-32 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || loadingTheme !== null}
              >
                <span className="block text-2xl mb-1">🚀</span>
                <span className="block text-lg font-['Lora'] text-gray-800/90">
                  Space Demo
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoSelect("japanese")}
                className="w-32 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || loadingTheme !== null}
              >
                <span className="block text-2xl mb-1">🌳</span>
                <span className="block text-lg font-['Lora'] text-gray-800/90">
                  Zen Demo
                </span>
              </motion.button>
            </div>

            {/* Create Gift Section */}
            <motion.div
              className="bg-gradient-to-r from-blue-500/70 to-purple-500/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl text-center font-['Lora'] mb-3">
                Create Memory
              </h2>
              <p className="text-sm mb-4 text-center text-white/90 font-['Lora']">
                Add photos, write messages, share love.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateGift}
                className="w-full px-4 py-3 bg-white/90 text-blue-600 rounded-xl hover:bg-white transition-colors duration-300 font-['Lora']"
              >
                Start →
              </motion.button>
            </motion.div>

            {/* Gift ID Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-12">
              <h2 className="text-2xl text-center font-['Lora'] text-gray-800/90 mb-2">
                🎁
              </h2>

              <div className="relative">
                <input
                  type="text"
                  value={giftId}
                  onChange={(e) => {
                    setGiftId(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter gift ID"
                  className="w-full px-4 py-3 mb-4 text-center bg-white/80 border border-gray-200 rounded-xl text-gray-800/90 placeholder:text-gray-400/90 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent font-['Lora']"
                />
                {giftId && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setGiftId("");
                      setError(null);
                    }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 min-h-0 min-w-0 p-2"
                  >
                    ×
                  </motion.button>
                )}
              </div>

              {error && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm font-['Lora'] ${
                    error.startsWith("Looking")
                      ? "bg-blue-50 border border-blue-200 text-blue-600/90"
                      : "bg-red-50 border border-red-200 text-red-600/90"
                  }`}
                >
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!giftId.trim() || isLoading}
                className="w-full px-4 py-3 bg-gray-800/90 text-white rounded-xl hover:bg-gray-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-['Lora']"
                onClick={() => handleUnwrapGift(giftId)}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Unwrapping...</span>
                  </>
                ) : (
                  "Unwrap"
                )}
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
    </>
  );
};

export default WelcomeScreen;
