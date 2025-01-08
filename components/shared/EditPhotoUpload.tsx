import { useCallback, useState, useEffect } from "react";
import type { Photo } from "@utils/types/gift";
import type { CollaborativeGift } from "@utils/types/collaborative";
import { BasePhotoUpload } from "./base/BasePhotoUpload";
import { PhotoDateEditor } from "./base/PhotoDateEditor";
import { PhotoThumbnail } from "./base/PhotoThumbnail";
import { useIPFSImageCache } from "@hooks/useIPFSImageCache";

interface EditPhotoUploadProps {
  gift: CollaborativeGift;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
}

interface LoadingState {
  status: "idle" | "loading" | "error" | "success";
  message?: string;
  progress?: {
    loaded: number;
    total: number;
  };
}

export function EditPhotoUpload({
  gift,
  photos,
  onPhotosChange,
  customDates = {},
  onCustomDatesChange,
}: EditPhotoUploadProps) {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null
  );
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: "idle",
  });
  const { preloadImages, clearCache } = useIPFSImageCache();

  // Preload existing IPFS images
  useEffect(() => {
    const loadExistingPhotos = async () => {
      setLoadingState({
        status: "loading",
        message: "Loading existing photos...",
        progress: { loaded: 0, total: gift.photos.length },
      });

      try {
        // Get IPFS hashes from gift photos
        const ipfsHashes = gift.photos.map((photo) => photo.ipfsHash);

        // Preload all images with progress tracking
        const urlMap = new Map<string, string>();
        const batchSize = 3;

        for (let i = 0; i < ipfsHashes.length; i += batchSize) {
          const batch = ipfsHashes.slice(i, i + batchSize);
          const results = await preloadImages(batch);

          results.forEach((url, hash) => urlMap.set(hash, url));

          setLoadingState((prev) => ({
            status: "loading",
            message: "Loading existing photos...",
            progress: {
              loaded: Math.min(i + batchSize, ipfsHashes.length),
              total: ipfsHashes.length,
            },
          }));
        }

        // Create Photo objects for existing photos
        const existingPhotos = gift.photos.map((giftPhoto) => {
          const preview = urlMap.get(giftPhoto.ipfsHash) || "";
          return {
            file: new File([], giftPhoto.name),
            preview,
            dateTaken: giftPhoto.dateTaken,
            originalDate: giftPhoto.dateTaken,
            isExisting: true,
            isNew: false,
            isDateModified: false,
            ipfsHash: giftPhoto.ipfsHash,
          } as Photo;
        });

        onPhotosChange(existingPhotos);
        setLoadingState({ status: "success" });
      } catch (error) {
        console.error("Error loading existing photos:", error);
        setLoadingState({
          status: "error",
          message:
            "Failed to load some photos. You can try refreshing the page.",
        });
      }
    };

    if (gift.photos.length > 0) {
      loadExistingPhotos();
    } else {
      setLoadingState({ status: "success" });
    }

    // Cleanup cache on unmount
    return () => {
      clearCache();
    };
  }, [gift.photos, preloadImages, clearCache, onPhotosChange]);

  // Validate file size and type
  const validateFile = useCallback((file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.warn(
        `File ${file.name} is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      );
      return false;
    }
    if (!file.type.startsWith("image/")) {
      console.warn(`File ${file.name} is not an image`);
      return false;
    }
    return true;
  }, []);

  // Process new file uploads
  const processFile = useCallback(async (file: File): Promise<Photo> => {
    const dateTaken = new Date(file.lastModified).toISOString();
    return {
      file,
      preview: URL.createObjectURL(file),
      dateTaken,
      originalDate: dateTaken,
      isNew: true,
      isExisting: false,
      isDateModified: false,
    };
  }, []);

  // Handle date changes
  const handleDateChange = useCallback(
    (index: number, newDate: string) => {
      const photo = photos[index];
      if (!photo.originalDate) {
        photo.originalDate = photo.dateTaken;
      }

      const updatedPhotos = photos.map((p, i) =>
        i === index
          ? {
              ...p,
              dateTaken: newDate,
              isDateModified: newDate !== p.originalDate,
            }
          : p
      );

      onPhotosChange(updatedPhotos);
      if (onCustomDatesChange) {
        const newDates = { ...customDates, [photo.file.name]: newDate };
        onCustomDatesChange(newDates);
      }
      setEditingPhotoIndex(null);
    },
    [photos, customDates, onCustomDatesChange, onPhotosChange]
  );

  // Handle photo deletion
  const handleDelete = useCallback(
    (index: number) => {
      const updatedPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(updatedPhotos);
    },
    [photos, onPhotosChange]
  );

  // Render individual photo
  const renderPhoto = useCallback(
    (photo: Photo, index: number) => (
      <>
        <PhotoThumbnail
          photo={photo}
          index={index}
          onEdit={() => setEditingPhotoIndex(index)}
          onDelete={() => handleDelete(index)}
        />
        {editingPhotoIndex === index && (
          <PhotoDateEditor
            dateTaken={photo.dateTaken}
            onDateChange={(newDate) => handleDateChange(index, newDate)}
            onClose={() => setEditingPhotoIndex(null)}
          />
        )}
      </>
    ),
    [editingPhotoIndex, handleDateChange, handleDelete]
  );

  if (loadingState.status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{loadingState.message}</p>
            {loadingState.progress && (
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(loadingState.progress.loaded / loadingState.progress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingState.progress.loaded} of{" "}
                  {loadingState.progress.total} photos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loadingState.status === "error") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto text-red-500">❌</div>
          <div>
            <p className="text-red-600 font-medium">Failed to Load Photos</p>
            <p className="text-sm text-gray-500 mt-1">{loadingState.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BasePhotoUpload
      photos={photos}
      onPhotosChange={onPhotosChange}
      maxPhotos={30}
      batchSize={10}
      customDates={customDates}
      onCustomDatesChange={onCustomDatesChange}
      validateFile={validateFile}
      processFile={processFile}
      renderPhoto={renderPhoto}
    />
  );
}
