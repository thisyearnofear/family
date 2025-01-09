import { useEffect, useState } from "react";
import { CACHE_AGE } from "@utils/constants/upload";

interface CacheEntry {
  data: string;
  timestamp: number;
}

const CACHE_KEY_PREFIX = "ipfs-image-";

// In-memory cache for faster access
const memoryCache = new Map<string, CacheEntry>();

export function useIPFSImageCache(ipfsHash: string | null) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ipfsHash) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${ipfsHash}`;

    async function loadImage() {
      try {
        // Check memory cache first
        const memoryCacheEntry = memoryCache.get(cacheKey);
        if (
          memoryCacheEntry &&
          Date.now() - memoryCacheEntry.timestamp < CACHE_AGE
        ) {
          setImageData(memoryCacheEntry.data);
          setIsLoading(false);
          return;
        }

        // Check localStorage cache
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_AGE) {
            // Update memory cache
            memoryCache.set(cacheKey, { data, timestamp });
            setImageData(data);
            setIsLoading(false);
            return;
          }
        }

        // Fetch from API if not in cache or cache expired
        const response = await fetch(`/api/pinata/image?cid=${ipfsHash}`);
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64data = reader.result as string;
          const timestamp = Date.now();

          // Update memory cache
          memoryCache.set(cacheKey, { data: base64data, timestamp });

          // Update localStorage cache
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ data: base64data, timestamp })
            );
          } catch (e) {
            console.warn("Failed to cache image in localStorage:", e);
          }

          setImageData(base64data);
          setIsLoading(false);
        };

        reader.onerror = () => {
          throw new Error("Failed to read image data");
        };

        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Error loading image:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    }

    loadImage();

    // Clear expired cache entries periodically
    const clearExpiredCache = () => {
      const now = Date.now();
      // Clear memory cache
      memoryCache.forEach((value, key) => {
        if (now - value.timestamp >= CACHE_AGE) {
          memoryCache.delete(key);
        }
      });
      // Clear localStorage cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const { timestamp } = JSON.parse(item);
              if (now - timestamp >= CACHE_AGE) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.warn("Failed to parse cache entry:", e);
          }
        }
      }
    };

    const interval = setInterval(clearExpiredCache, CACHE_AGE / 2);

    return () => {
      clearInterval(interval);
    };
  }, [ipfsHash]);

  return { imageData, isLoading, error };
}
