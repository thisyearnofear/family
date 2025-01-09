import { useState, useCallback, useEffect } from "react";
import { Photo } from "../utils/types/gift";

type LoadingState =
  | "idle"
  | "loading"
  | "error"
  | "more-available"
  | "complete";

interface UseGiftPhotosReturn {
  photos: Photo[];
  loadedPhotos: Photo[];
  skippedPhotos: Photo[];
  loadingState: LoadingState;
  setPhotos: (photos: Photo[]) => void;
  loadNextBatch: () => Promise<void>;
  updatePhoto: (index: number, updatedPhoto: Photo) => void;
}

const BATCH_SIZE = 5;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export function useGiftPhotos(): UseGiftPhotosReturn {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadedPhotos, setLoadedPhotos] = useState<Photo[]>([]);
  const [skippedPhotos, setSkippedPhotos] = useState<Photo[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentBatch, setCurrentBatch] = useState(0);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Photo>>(
    new Map()
  );

  // Update a specific photo by index
  const updatePhoto = useCallback((index: number, updatedPhoto: Photo) => {
    setLoadedPhotos((prev: Photo[]) => {
      const newPhotos = [...prev];
      newPhotos[index] = updatedPhoto;
      return newPhotos;
    });

    // Store the update for future batches
    setPendingUpdates((prev: Map<string, Photo>) => {
      const newMap = new Map(prev);
      const key = updatedPhoto.ipfsHash || updatedPhoto.file.name;
      newMap.set(key, updatedPhoto);
      return newMap;
    });
  }, []);

  const loadNextBatch = useCallback(async () => {
    try {
      setLoadingState("loading");

      const start = currentBatch * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, photos.length);
      const batch = photos.slice(start, end);

      const loadedBatch = await Promise.all(
        batch.map(async (photo: Photo) => {
          try {
            if (photo.file.size > MAX_IMAGE_SIZE) {
              setSkippedPhotos((prev: Photo[]) => [...prev, photo]);
              return null;
            }

            // Check if this photo has pending updates
            const key = photo.ipfsHash || photo.file.name;
            const updatedPhoto = pendingUpdates.get(key);
            if (updatedPhoto) {
              return updatedPhoto;
            }

            return photo;
          } catch (error) {
            console.error("Error loading photo:", error);
            return null;
          }
        })
      );

      const validPhotos = loadedBatch.filter((p): p is Photo => p !== null);

      setLoadedPhotos((prev: Photo[]) => {
        // Create a new array with all previous photos
        const newPhotos = [...prev];

        // Add new photos at the correct indices
        validPhotos.forEach((photo: Photo, i: number) => {
          newPhotos[start + i] = photo;
        });

        return newPhotos;
      });

      setCurrentBatch((prev: number) => prev + 1);

      if (end < photos.length) {
        setLoadingState("more-available");
      } else {
        setLoadingState("complete");
      }
    } catch (error) {
      console.error("Error loading next batch:", error);
      setLoadingState("error");
    }
  }, [currentBatch, photos, pendingUpdates]);

  // Reset state when photos array changes
  useEffect(() => {
    setLoadedPhotos([]);
    setSkippedPhotos([]);
    setPendingUpdates(new Map());
    setCurrentBatch(0);
    setLoadingState("idle");
  }, [photos]);

  return {
    photos,
    loadedPhotos,
    skippedPhotos,
    loadingState,
    setPhotos,
    loadNextBatch,
    updatePhoto,
  };
}
