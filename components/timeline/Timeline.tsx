import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { SONGS } from "../../utils/constants";
import type { ImageProps } from "../../utils/types/types";

interface TimelineProps {
  images: ImageProps[];
  theme: "space" | "japanese" | undefined;
  messages?: string[];
  music?: string[];
}

export default function Timeline({
  images,
  theme,
  messages = [],
  music = [],
}: TimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const { isPlaying, currentPlayingSong, togglePlaySong } = useAudioPlayer();

  // Start playing music when component mounts
  useEffect(() => {
    if (music && music.length > 0) {
      // Find the matching song from our SONGS constant
      const songPath = SONGS.find((song) =>
        music.some(
          (m) => m.includes(song.title.toLowerCase()) || song.path.includes(m)
        )
      )?.path;

      if (songPath) {
        console.log("Starting music playback:", songPath);
        togglePlaySong(songPath);
      } else {
        console.warn("No matching song found for:", music[0]);
      }
    }
  }, [music, togglePlaySong]);

  // Auto-advance photos every 5 seconds
  useEffect(() => {
    if (!showMessage) {
      const timer = setInterval(() => {
        if (currentIndex === images.length - 1) {
          // If we're at the last image and have messages, show a message
          if (messages.length > 0 && currentMessage < messages.length) {
            setShowMessage(true);
          } else {
            setCurrentIndex(0); // Otherwise, loop back to start
          }
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [
    currentIndex,
    images.length,
    showMessage,
    messages.length,
    currentMessage,
  ]);

  // Handle message display timing
  useEffect(() => {
    if (showMessage) {
      const messageTimer = setTimeout(() => {
        setShowMessage(false);
        if (currentMessage < messages.length - 1) {
          setCurrentMessage((prev) => prev + 1);
        } else {
          setCurrentIndex(0); // Reset to first image after last message
          setCurrentMessage(0); // Reset message counter
        }
      }, 4000);

      return () => clearTimeout(messageTimer);
    }
  }, [showMessage, currentMessage, messages.length]);

  // Theme-specific animations
  const getImageAnimation = () => {
    if (theme === "space") {
      return {
        initial: { scale: 1.2, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
        transition: { duration: 1 },
      };
    }
    return {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 },
      transition: { duration: 0.8 },
    };
  };

  const getMessageAnimation = () => {
    if (theme === "space") {
      return {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
        transition: { duration: 0.5 },
      };
    }
    return {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 },
      transition: { duration: 0.5 },
    };
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background theme elements */}
      <div
        className={`absolute inset-0 ${
          theme === "space"
            ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-purple-900 to-violet-950"
            : "bg-gradient-to-br from-red-50 via-red-100 to-red-200"
        }`}
      >
        {theme === "space" && (
          <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-50" />
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">
          {showMessage ? (
            <motion.div
              key="message"
              className="max-w-lg w-full text-center p-6 rounded-lg bg-white bg-opacity-90"
              {...getMessageAnimation()}
            >
              <p className="text-xl sm:text-2xl font-medium text-gray-900">
                {messages[currentMessage]}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`image-${currentIndex}`}
              className="relative aspect-[4/3] w-full max-w-4xl rounded-lg overflow-hidden"
              {...getImageAnimation()}
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].description || "Timeline photo"}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Music controls */}
      {music.length > 0 && (
        <div className="fixed bottom-4 right-4 z-20">
          <button
            onClick={() => {
              const songPath = SONGS.find((song) =>
                music.some(
                  (m) =>
                    m.includes(song.title.toLowerCase()) ||
                    song.path.includes(m)
                )
              )?.path;
              if (songPath) togglePlaySong(songPath);
            }}
            className="p-3 rounded-full bg-white bg-opacity-90 shadow-lg hover:bg-opacity-100 transition-opacity"
          >
            {SONGS.some((song) => currentPlayingSong === song.path) &&
            isPlaying ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </motion.div>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
