import React from "react";
import { BasePhotoUpload } from "./base/BasePhotoUpload";
import { BaseProgressiveImage } from "./base/ProgressiveImage";
import type { Photo } from "@utils/types/gift";
import { MAX_IMAGE_SIZE, formatFileSize } from "@utils/constants/upload";

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
  maxTotalSize?: number;
  currentSize?: number;
}

const renderPhoto = (photo: Photo, index: number): React.ReactElement => (
  <div key={index} className="relative aspect-square">
    <BaseProgressiveImage
      src={photo.preview}
      alt={`Photo ${index + 1}`}
      width={400}
      height={400}
      className="w-full h-full object-cover rounded-lg"
      quality={75}
      placeholder="blur"
      blurDataURL={photo.preview}
    />
  </div>
);

export function PhotoUpload({
  photos,
  onPhotosChange,
  customDates,
  onCustomDatesChange,
  maxTotalSize,
  currentSize,
}: PhotoUploadProps): React.ReactElement {
  const handlePhotosChange = (newPhotos: Photo[]) => {
    // Filter out files that exceed the per-image size limit
    const validPhotos = newPhotos.filter(
      (photo) => photo.file.size <= MAX_IMAGE_SIZE
    );
    const oversizedPhotos = newPhotos.filter(
      (photo) => photo.file.size > MAX_IMAGE_SIZE
    );

    if (oversizedPhotos.length > 0) {
      alert(
        `The following files exceed the ${formatFileSize(MAX_IMAGE_SIZE)} size limit:\n\n${oversizedPhotos
          .map((p) => `${p.file.name} (${formatFileSize(p.file.size)})`)
          .join("\n")}\n\nPlease compress these images before uploading.`
      );
      if (validPhotos.length === 0) return;
    }

    onPhotosChange(validPhotos);
  };

  return (
    <BasePhotoUpload
      photos={photos}
      onPhotosChange={handlePhotosChange}
      renderPhoto={renderPhoto}
      customDates={customDates}
      onCustomDatesChange={onCustomDatesChange}
      maxTotalSize={maxTotalSize}
      currentSize={currentSize}
    />
  );
}
