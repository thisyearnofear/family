import Image from "next/image";
import { useState, useEffect } from "react";
import type { ImageProps } from "@utils/types";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface MemoryImageProps {
  image: ImageProps;
  isInteractive?: boolean;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
  image,
  isInteractive = false,
  className = "",
  priority = false,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Construct the full URL for the image
  const imageUrl =
    image.url ||
    (image.ipfsHash
      ? image.ipfsHash.startsWith("http")
        ? image.ipfsHash
        : `/api/pinata/image?cid=${image.ipfsHash}`
      : null);

  if (!imageUrl) {
    console.error("No valid image URL found:", image);
    return null;
  }

  // Auto-retry logic
  useEffect(() => {
    if (isError && retryCount < MAX_RETRIES) {
      const timer = setTimeout(
        () => {
          setIsError(false);
          setRetryCount((prev) => prev + 1);
        },
        2000 * (retryCount + 1)
      ); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [isError, retryCount]);

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 animate-pulse" />
        <p className="text-sm text-gray-500">Loading your memory...</p>
      </div>
    </div>
  );

  // Error placeholder component
  const ErrorPlaceholder = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-center"
    >
      <div className="text-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 mx-auto mb-3 text-blue-500"
        >
          <ArrowPathIcon />
        </motion.div>
        <p className="text-sm text-gray-600 mb-2">
          {retryCount < MAX_RETRIES
            ? "Retrieving your memory..."
            : "Taking longer than expected..."}
        </p>
        {retryCount >= MAX_RETRIES && (
          <button
            onClick={() => {
              setIsError(false);
              setRetryCount(0);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );

  // In production, use a regular img tag to bypass Next.js image optimization
  if (process.env.NODE_ENV === "production") {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <img
          src={imageUrl}
          alt={`Image taken on ${image.dateTaken || "unknown date"}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isLoading || isError ? "opacity-0" : "opacity-100"
          } ${isInteractive ? "cursor-pointer" : ""}`}
          onLoad={() => {
            setIsLoading(false);
            setIsError(false);
            onLoad?.();
          }}
          onError={() => {
            console.warn("Image load attempt failed:", imageUrl);
            setIsError(true);
            setIsLoading(false);
          }}
        />
        <AnimatePresence>
          {(isLoading || isError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? <LoadingPlaceholder /> : <ErrorPlaceholder />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // In development, use Next.js Image component
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageUrl}
        alt={`Image taken on ${image.dateTaken || "unknown date"}`}
        className={`object-cover transition-opacity duration-700 ${
          isLoading || isError ? "opacity-0" : "opacity-100"
        } ${isInteractive ? "cursor-pointer" : ""}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={90}
        priority={priority}
        onLoadingComplete={() => {
          setIsLoading(false);
          setIsError(false);
          onLoad?.();
        }}
        onError={() => {
          console.warn("Image load attempt failed:", imageUrl);
          setIsError(true);
          setIsLoading(false);
        }}
      />
      <AnimatePresence>
        {(isLoading || isError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLoading ? <LoadingPlaceholder /> : <ErrorPlaceholder />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryImage;
