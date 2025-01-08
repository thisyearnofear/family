import { useCallback, useState } from "react";
import type { Photo } from "@utils/types/gift";
import { BasePhotoUpload } from "./base/BasePhotoUpload";
import { PhotoDateEditor } from "./base/PhotoDateEditor";
import { PhotoThumbnail } from "./base/PhotoThumbnail";

interface CreatePhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
}

export function CreatePhotoUpload({
  photos,
  onPhotosChange,
  customDates = {},
  onCustomDatesChange,
}: CreatePhotoUploadProps) {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null
  );

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

  // Process file and extract date
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
