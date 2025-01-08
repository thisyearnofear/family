import React, { useCallback, useState, useEffect } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { PhotoIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import type { Photo } from "@utils/types/gift";
import {
  UPLOAD_LIMITS,
  formatFileSize,
  getFileSizeError,
} from "@utils/constants/upload";

interface ProgressState {
  processed: number;
  total: number;
  failed: number;
}

export interface BasePhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  batchSize?: number;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
  renderPhoto: (photo: Photo, index: number) => React.ReactNode;
  validateFile?: (file: File) => boolean;
  processFile?: (file: File) => Promise<Photo>;
  onError?: (error: string) => void;
  maxTotalSize?: number;
}

export function BasePhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = UPLOAD_LIMITS.MAX_PHOTOS,
  batchSize = UPLOAD_LIMITS.BATCH_SIZE,
  customDates = {},
  onCustomDatesChange,
  renderPhoto,
  validateFile,
  processFile,
  onError,
  maxTotalSize = UPLOAD_LIMITS.MAX_TOTAL_SIZE,
}: BasePhotoUploadProps): React.ReactElement {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [previewUrls] = useState<Map<string, string>>(new Map());

  // Regenerate previews for existing files and calculate total size
  useEffect(() => {
    const regeneratePreviews = async () => {
      let size = 0;
      const updatedPhotos = photos.map((photo) => {
        size += photo.file.size;

        // Skip if it's an IPFS photo or already has a valid preview
        if (
          photo.ipfsHash ||
          (photo.preview && !previewUrls.has(photo.file.name))
        ) {
          return photo;
        }

        // Generate new preview if needed
        let preview = previewUrls.get(photo.file.name);
        if (!preview) {
          preview = URL.createObjectURL(photo.file);
          previewUrls.set(photo.file.name, preview);
        }

        return {
          ...photo,
          preview,
        };
      });

      setTotalSize(size);
      if (JSON.stringify(photos) !== JSON.stringify(updatedPhotos)) {
        onPhotosChange(updatedPhotos);
      }
    };

    regeneratePreviews();

    // Cleanup previews when component unmounts
    return () => {
      previewUrls.forEach((url: string) => {
        if (!url.startsWith("ipfs://")) {
          URL.revokeObjectURL(url);
        }
      });
      previewUrls.clear();
    };
  }, [photos, onPhotosChange, previewUrls]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => setLastError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastError]);

  const handleError = useCallback(
    (error: string) => {
      setLastError(error);
      onError?.(error);
    },
    [onError]
  );

  const validateTotalSize = useCallback(
    (newFiles: File[]) => {
      const newTotalSize =
        totalSize + newFiles.reduce((sum, file) => sum + file.size, 0);
      if (newTotalSize > maxTotalSize) {
        const currentMB = formatFileSize(totalSize);
        const newMB = formatFileSize(newTotalSize - totalSize);
        const maxMB = formatFileSize(maxTotalSize);
        handleError(
          `Total size would exceed ${maxMB} limit. Current: ${currentMB}, New: ${newMB}`
        );
        return false;
      }
      return true;
    },
    [totalSize, maxTotalSize, handleError]
  );

  const validateSingleFile = useCallback(
    (file: File): boolean => {
      const error = getFileSizeError(file.size);
      if (error) {
        handleError(error);
        return false;
      }
      return true;
    },
    [handleError]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        handleError(`Maximum number of photos (${maxPhotos}) reached`);
        return;
      }

      // Validate individual file sizes first
      const validSizedFiles = acceptedFiles.filter(validateSingleFile);
      if (validSizedFiles.length === 0) return;

      // Then validate total size
      if (!validateTotalSize(validSizedFiles)) return;

      try {
        setIsProcessing(true);
        setProgress({ processed: 0, total: 0, failed: 0 });

        // Process files in batches
        const filesToProcess = validSizedFiles.slice(
          0,
          Math.min(batchSize, remainingSlots)
        );

        if (validSizedFiles.length > batchSize) {
          handleError(
            `Processing first ${batchSize} photos. Please add remaining photos in smaller batches.`
          );
        }

        // Validate files if validator provided
        const validFiles = validateFile
          ? filesToProcess.filter((file) => {
              try {
                return validateFile(file);
              } catch (error) {
                console.error("File validation error:", error);
                return false;
              }
            })
          : filesToProcess;

        if (validFiles.length === 0) {
          handleError("No valid files to process");
          return;
        }

        setProgress({ processed: 0, total: validFiles.length, failed: 0 });

        // Process files in sequence to avoid memory issues
        const processedPhotos: Photo[] = [];
        let failedCount = 0;
        let newTotalSize = totalSize;

        for (let i = 0; i < validFiles.length; i++) {
          try {
            const file = validFiles[i];
            const photo = processFile
              ? await processFile(file)
              : ({
                  file,
                  preview: URL.createObjectURL(file),
                  dateTaken: new Date(file.lastModified).toISOString(),
                  isNew: true,
                  isExisting: false,
                  isDateModified: false,
                } as Photo);

            // Store preview URL for cleanup
            if (photo.preview && !photo.ipfsHash) {
              previewUrls.set(file.name, photo.preview);
            }

            processedPhotos.push(photo);
            newTotalSize += file.size;

            setProgress((prev: ProgressState | null) => ({
              processed: (prev?.processed || 0) + 1,
              total: validFiles.length,
              failed: failedCount,
            }));
          } catch (error) {
            console.error("Error processing file:", error);
            failedCount++;
            setProgress((prev: ProgressState | null) => ({
              processed: prev?.processed || 0,
              total: validFiles.length,
              failed: failedCount,
            }));
            handleError(`Failed to process ${validFiles[i].name}`);
          }
        }

        if (processedPhotos.length > 0) {
          setTotalSize(newTotalSize);
          onPhotosChange([...photos, ...processedPhotos]);
        }

        if (failedCount > 0) {
          handleError(`Failed to process ${failedCount} photos`);
        }
      } catch (error) {
        console.error("Error in onDrop:", error);
        handleError("Failed to process photos");
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [
      photos,
      onPhotosChange,
      maxPhotos,
      batchSize,
      validateFile,
      processFile,
      handleError,
      totalSize,
      validateTotalSize,
      validateSingleFile,
      previewUrls,
    ]
  );

  const dropzoneConfig: DropzoneOptions = {
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".heic"],
    },
    onDrop,
    disabled: isProcessing || photos.length >= maxPhotos,
    maxSize: UPLOAD_LIMITS.MAX_SINGLE_FILE,
    multiple: true,
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneConfig);

  return (
    <div className="space-y-4">
      {/* Header with size info */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Photos ({photos.length})</h3>
          <div className="text-sm space-x-4">
            <span
              className={`${photos.length >= maxPhotos * 0.8 ? "text-amber-600 font-medium" : "text-gray-500"}`}
            >
              {maxPhotos - photos.length} slots remaining
            </span>
            <span
              className={`${
                totalSize > maxTotalSize * 0.8
                  ? "text-red-600 font-medium animate-pulse"
                  : totalSize > maxTotalSize * 0.6
                    ? "text-amber-600 font-medium"
                    : "text-gray-500"
              }`}
            >
              Size: {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
            </span>
          </div>
        </div>

        {/* Size progress bar with better visual feedback */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 transform ${
              totalSize > maxTotalSize * 0.8
                ? "bg-red-500 animate-pulse"
                : totalSize > maxTotalSize * 0.6
                  ? "bg-amber-500"
                  : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min((totalSize / maxTotalSize) * 100, 100)}%`,
            }}
          />
        </div>

        {/* Size warnings with improved visibility */}
        {totalSize > maxTotalSize * 0.8 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-red-800">
                Warning: Approaching size limit
              </p>
              <p className="text-sm text-red-700">
                Total photo size is {formatFileSize(totalSize)} of{" "}
                {formatFileSize(maxTotalSize)} limit. You may need to remove
                some photos or use smaller files to avoid upload issues.
              </p>
            </div>
          </div>
        )}
        {totalSize > maxTotalSize * 0.6 && totalSize <= maxTotalSize * 0.8 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3">
            <ExclamationCircleIcon className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-amber-800">
                Note: Size limit at{" "}
                {Math.round((totalSize / maxTotalSize) * 100)}%
              </p>
              <p className="text-sm text-amber-700">
                Consider using smaller files for remaining photos to stay within
                the {formatFileSize(maxTotalSize)} limit.
              </p>
            </div>
          </div>
        )}
      </div>

      {lastError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{lastError}</p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : isProcessing
              ? "border-yellow-300 bg-yellow-50"
              : photos.length >= maxPhotos
                ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                : totalSize > maxTotalSize * 0.8
                  ? "border-red-300 hover:border-red-400 bg-red-50/50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          {...getInputProps()}
          disabled={isProcessing || photos.length >= maxPhotos}
        />
        <PhotoIcon
          className={`w-12 h-12 mx-auto ${
            totalSize > maxTotalSize * 0.8 ? "text-red-400" : "text-gray-400"
          }`}
        />
        {isProcessing ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">Processing photos...</p>
            {progress && (
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(progress.processed / progress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    {progress.processed} of {progress.total} processed
                  </span>
                  {progress.failed > 0 && (
                    <span className="text-red-500">
                      {progress.failed} failed
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-600">
              {photos.length >= maxPhotos
                ? "Maximum number of photos reached"
                : "Drag & drop photos here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Maximum {maxPhotos} photos ({formatFileSize(maxTotalSize)} total),{" "}
              {batchSize} at a time. Each photo up to{" "}
              {formatFileSize(UPLOAD_LIMITS.MAX_SINGLE_FILE)}.
            </p>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => renderPhoto(photo, index))}
        </div>
      )}
    </div>
  );
}
