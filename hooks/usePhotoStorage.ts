import { useState, useEffect, useCallback } from "react";
import { openDB, IDBPDatabase } from "idb";
import type { Photo } from "@utils/types/gift";

const DB_NAME = "photoStorage";
const STORE_NAME = "photos";
const DB_VERSION = 1;

interface StoredPhoto {
  id: string;
  file: Blob;
  preview: string;
  dateTaken: string;
  originalDate: string;
  isNew: boolean;
  isExisting: boolean;
  isDateModified: boolean;
  fileName: string;
}

type PhotoDB = {
  [STORE_NAME]: StoredPhoto;
};

export function usePhotoStorage(draftId: string) {
  const [db, setDb] = useState<IDBPDatabase<PhotoDB> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${draftId}-photos-metadata` && e.newValue) {
        // Trigger a re-fetch of photos when metadata changes in another tab
        loadPhotos();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [draftId]);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<PhotoDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
          },
        });
        setDb(database);
      } catch (error) {
        console.error("Error initializing IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // Save photos to IndexedDB
  const savePhotos = useCallback(
    async (photos: Photo[]) => {
      if (!db) return;

      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        // Clear existing photos for this draft
        const keys = await store.getAllKeys();
        for (const key of keys) {
          if (key.toString().startsWith(`${draftId}-`)) {
            await store.delete(key);
          }
        }

        // Store each photo
        for (const photo of photos) {
          const storedPhoto: StoredPhoto = {
            id: `${draftId}-${photo.file.name}`,
            file: photo.file,
            preview: photo.preview,
            dateTaken: photo.dateTaken,
            originalDate: photo.originalDate || photo.dateTaken,
            isNew: photo.isNew || false,
            isExisting: photo.isExisting || false,
            isDateModified: photo.isDateModified || false,
            fileName: photo.file.name,
          };
          await store.put(storedPhoto);
        }

        await tx.done;

        // Store metadata in localStorage for quick access and cross-tab sync
        const metadata = photos.map((photo) => ({
          fileName: photo.file.name,
          dateTaken: photo.dateTaken,
          originalDate: photo.originalDate || photo.dateTaken,
          isNew: photo.isNew || false,
          isExisting: photo.isExisting || false,
          isDateModified: photo.isDateModified || false,
          lastModified: Date.now(),
        }));
        localStorage.setItem(
          `${draftId}-photos-metadata`,
          JSON.stringify(metadata)
        );
      } catch (error) {
        console.error("Error saving photos:", error);
        throw error;
      }
    },
    [db, draftId]
  );

  // Load photos from IndexedDB
  const loadPhotos = useCallback(async (): Promise<Photo[]> => {
    if (!db) return [];

    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const storedPhotos = await store.getAll();

      // Filter photos for this draft
      const draftPhotos = storedPhotos.filter((photo: StoredPhoto) =>
        photo.id.startsWith(`${draftId}-`)
      );

      // Create new File objects and regenerate previews
      return Promise.all(
        draftPhotos.map(async (stored: StoredPhoto) => {
          const file = new File([stored.file], stored.fileName, {
            type: stored.file.type,
          });

          // Regenerate preview URL from the blob
          const preview = URL.createObjectURL(stored.file);

          return {
            file,
            preview,
            dateTaken: stored.dateTaken,
            originalDate: stored.originalDate,
            isNew: stored.isNew,
            isExisting: stored.isExisting,
            isDateModified: stored.isDateModified,
          };
        })
      );
    } catch (error) {
      console.error("Error loading photos:", error);
      return [];
    }
  }, [db, draftId]);

  // Clear photos for current draft
  const clearPhotos = useCallback(async () => {
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      // Get all keys
      const keys = await store.getAllKeys();

      // Delete photos for this draft
      for (const key of keys) {
        if (key.toString().startsWith(`${draftId}-`)) {
          await store.delete(key);
        }
      }

      await tx.done;
      localStorage.removeItem(`${draftId}-photos-metadata`);
    } catch (error) {
      console.error("Error clearing photos:", error);
    }
  }, [db, draftId]);

  // Clear all stored photos and metadata
  const clearAllPhotos = useCallback(async () => {
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      // Clear all photos from IndexedDB
      await store.clear();
      await tx.done;

      // Clear all photo metadata from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith("-photos-metadata")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Also clear the draft gift data
      localStorage.removeItem("draftGift");
    } catch (error) {
      console.error("Error clearing all photos:", error);
    }
  }, [db]);

  return {
    isLoading,
    savePhotos,
    loadPhotos,
    clearPhotos,
    clearAllPhotos,
  };
}
