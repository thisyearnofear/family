import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { Photo } from "@utils/types/gift";
import { MAX_IMAGE_SIZE, formatFileSize } from "@utils/constants/upload";
import { extractExifData } from "@utils/image";

interface BasePhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  renderPhoto?: (photo: Photo, index: number) => React.ReactNode;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
  maxTotalSize?: number;
  currentSize?: number;
  isPreviewMode?: boolean;
}

export function BasePhotoUpload({
  photos,
  onPhotosChange,
  renderPhoto,
  customDates,
  onCustomDatesChange,
  maxTotalSize,
  currentSize,
  isPreviewMode,
}: BasePhotoUploadProps): React.ReactElement {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isPreviewMode) return;

      // Filter out files that exceed the per-image size limit
      const validFiles = acceptedFiles.filter(
        (file) => file.size <= MAX_IMAGE_SIZE
      );
      const oversizedFiles = acceptedFiles.filter(
        (file) => file.size > MAX_IMAGE_SIZE
      );

      if (oversizedFiles.length > 0) {
        alert(
          `The following files exceed the ${formatFileSize(MAX_IMAGE_SIZE)} size limit:\n\n${oversizedFiles
            .map((f) => `${f.name} (${formatFileSize(f.size)})`)
            .join("\n")}\n\nPlease compress these images before uploading.`
        );
        if (validFiles.length === 0) return;
      }

      // Check if adding these files would exceed the total size limit
      if (maxTotalSize && currentSize) {
        const newTotalSize =
          currentSize + validFiles.reduce((sum, file) => sum + file.size, 0);
        if (newTotalSize > maxTotalSize) {
          alert(
            `Adding these photos would exceed the total size limit of ${formatFileSize(maxTotalSize)}`
          );
          return;
        }
      }

      // Process valid files
      const newPhotos = await Promise.all(
        validFiles.map(async (file) => {
          // Get date taken from EXIF if available
          let dateTaken = new Date().toISOString();
          try {
            if (file.type.startsWith("image/")) {
              const arrayBuffer = await file.arrayBuffer();
              const exifData = await extractExifData(arrayBuffer);
              if (exifData?.dateTaken) {
                dateTaken = exifData.dateTaken;
              }
            }
          } catch (error) {
            console.error("Error reading EXIF data:", error);
          }

          return {
            file,
            preview: URL.createObjectURL(file),
            dateTaken,
            originalDate: dateTaken,
            isExisting: false,
            isNew: true,
            isDateModified: false,
          } as Photo;
        })
      );

      onPhotosChange([...photos, ...newPhotos]);
    },
    [photos, onPhotosChange, maxTotalSize, currentSize, isPreviewMode]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".heic", ".webp"],
    },
    disabled: isPreviewMode,
  });

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      {!isPreviewMode && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the photos here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Drag & drop photos here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG, GIF, HEIC, WebP
              </p>
              <p className="text-sm text-gray-500">
                Maximum size per photo: {formatFileSize(MAX_IMAGE_SIZE)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) =>
            renderPhoto ? (
              renderPhoto(photo, index)
            ) : (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {!isPreviewMode && (
                  <button
                    onClick={() => {
                      const newPhotos = [...photos];
                      newPhotos.splice(index, 1);
                      onPhotosChange(newPhotos);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                {!isPreviewMode && customDates && onCustomDatesChange && (
                  <input
                    type="month"
                    value={
                      customDates[photo.file.name]?.substring(0, 7) ||
                      photo.dateTaken.substring(0, 7)
                    }
                    onChange={(e) => {
                      onCustomDatesChange({
                        ...customDates,
                        [photo.file.name]: `${e.target.value}-01`,
                      });
                    }}
                    className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/50 text-white rounded text-sm"
                  />
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
