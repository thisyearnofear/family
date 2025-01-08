import { useState, useCallback, useEffect } from "react";
import { UPLOAD_LIMITS } from "@utils/constants/upload";

interface CacheEntry {
  url: string;
  timestamp: number;
}

export function useIPFSImageCache() {
  const [cache] = useState<Map<string, CacheEntry>>(new Map());

  // Preload a single image from IPFS
  const preloadImage = useCallback(
    async (ipfsHash: string): Promise<string> => {
      const cached = cache.get(ipfsHash);
      if (cached && Date.now() - cached.timestamp < UPLOAD_LIMITS.CACHE_AGE) {
        return cached.url;
      }

      try {
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch IPFS image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        cache.set(ipfsHash, {
          url,
          timestamp: Date.now(),
        });

        return url;
      } catch (error) {
        console.error(`Error loading IPFS image ${ipfsHash}:`, error);
        throw error;
      }
    },
    [cache]
  );

  // Preload multiple images from IPFS
  const preloadImages = useCallback(
    async (ipfsHashes: string[]): Promise<Map<string, string>> => {
      const results = new Map<string, string>();

      await Promise.all(
        ipfsHashes.map(async (hash) => {
          try {
            const url = await preloadImage(hash);
            results.set(hash, url);
          } catch (error) {
            console.warn(`Failed to load image ${hash}:`, error);
            // Don't fail the entire batch for one failed image
          }
        })
      );

      return results;
    },
    [preloadImage]
  );

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    Array.from(cache.entries()).forEach(([hash, entry]) => {
      if (now - entry.timestamp > UPLOAD_LIMITS.CACHE_AGE) {
        URL.revokeObjectURL(entry.url);
        cache.delete(hash);
      }
    });
  }, [cache]);

  // Clear entire cache
  const clearCache = useCallback(() => {
    Array.from(cache.values()).forEach((entry) => {
      URL.revokeObjectURL(entry.url);
    });
    cache.clear();
  }, [cache]);

  // Periodically clear expired cache entries
  useEffect(() => {
    const interval = setInterval(
      clearExpiredCache,
      UPLOAD_LIMITS.CACHE_AGE / 2
    );
    return () => {
      clearInterval(interval);
      clearCache();
    };
  }, [clearExpiredCache, clearCache]);

  return {
    preloadImage,
    preloadImages,
    clearCache,
    clearExpiredCache,
  };
}
