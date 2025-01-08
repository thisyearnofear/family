import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import Image from "next/image";
import { useRouter } from "next/router";
import { getImages } from "@utils/api/pinata";
import type { ImageProps } from "@utils/types/types";
import { SONGS } from "@utils/constants";

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
] as const;

export default function WelcomeScreen({
  onCreateGift,
  onUnwrapGift,
}: WelcomeScreenProps): React.ReactElement {
  const router = useRouter();
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

      const { images, messages, music, title } = await getImages({
        groupId: demoId,
        hasFiles: false,
        hasIpfs: false,
        isDemo: true,
      });

      if (!images || images.length === 0) {
        throw new Error("No demo images found");
      }

      // Use metadata music if available, otherwise fall back to demo songs
      const demoMusic = theme === "space" ? [SONGS[0].path] : [SONGS[2].path];
      const finalMusic = music && music.length > 0 ? music : demoMusic;

      console.log("🚀 Demo content loaded:", {
        imageCount: images.length,
        messageCount: messages?.length,
        musicCount: finalMusic.length,
        music: finalMusic,
        isUsingMetadataMusic: music && music.length > 0,
      });

      // Set theme and transition to gift experience
      setTheme(theme);
      onUnwrapGift(images, demoId, theme, messages, finalMusic, title);
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

  const handleEdit = async (giftId: string) => {
    if (!giftId.trim()) {
      setError("Please enter a gift ID");
      return;
    }

    try {
      // Basic validation of gift ID format only
      const trimmedGiftId = giftId.trim();
      if (!trimmedGiftId.startsWith("gift-")) {
        throw new Error(
          "Invalid gift ID format. Gift IDs should start with 'gift-'"
        );
      }

      // Store gift ID in localStorage for persistence
      localStorage.setItem("lastEditedGiftId", trimmedGiftId);

      // Navigate to edit page without any API calls
      console.log("🎁 Navigating to edit gift:", { giftId: trimmedGiftId });
      router.push(`/edit/${trimmedGiftId}`);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Invalid gift ID format"
      );
    }
  };

  return (
    <>
      <AnimatePresence>
        {loadingTheme && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center ${
              loadingTheme === "space" ? "bg-black" : "bg-white"
            }`}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-6"
              >
                <span className="text-5xl">
                  {loadingTheme === "space" ? "🚀" : "🌳"}
                </span>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className={`text-xl ${
                  loadingTheme === "space"
                    ? "text-white font-space"
                    : "text-stone-800 font-japanese"
                }`}
              >
                {loadingTheme === "space"
                  ? "Preparing for launch..."
                  : "Opening the garden..."}
              </motion.div>
            </div>
          </div>
        )}
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
                Famile.xyz
              </h1>
              <p className="text-base md:text-lg text-gray-600/90 max-w-sm mx-auto font-['Lora'] leading-relaxed">
                Deepen bonds <br /> Treasure memories <br />
                Share moments
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
                  <div className="flex gap-2">
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUnwrapGift(giftId)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Unwrapping..." : "Unwrap Gift"}
                    </motion.button>
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEdit(giftId)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Checking...</span>
                        </>
                      ) : (
                        "Edit"
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm text-center mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Create Gift Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateGift}
              className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors mb-12"
            >
              Create New Gift
            </motion.button>

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
}
