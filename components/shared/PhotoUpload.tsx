import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { format } from "date-fns";
import {
  PhotoIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { Photo } from "@utils/types/gift";

const MAX_PHOTOS_PER_BATCH = 10;
const MAX_TOTAL_PHOTOS = 30;

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates: { [filename: string]: string };
  onCustomDatesChange: (dates: { [filename: string]: string }) => void;
  maxTotalSize?: number;
  currentSize?: number;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  customDates,
  onCustomDatesChange,
  maxTotalSize,
  currentSize = 0,
}: PhotoUploadProps) {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  // Utility function to extract date taken from EXIF data
  const getDateTaken = async (file: File): Promise<string | null> => {
    try {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const date = new Date(file.lastModified);
          resolve(date.toISOString());
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.warn("Error getting date taken:", error);
      return null;
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = MAX_TOTAL_PHOTOS - photos.length;
      if (remainingSlots <= 0) {
        alert("Maximum number of photos reached (30)");
        return;
      }

      // Validate file sizes and types
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const validFiles = acceptedFiles.filter((file) => {
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
      });

      // Process in batches if needed
      const filesToProcess = validFiles.slice(
        0,
        Math.min(MAX_PHOTOS_PER_BATCH, remainingSlots)
      );
      if (validFiles.length > MAX_PHOTOS_PER_BATCH) {
        alert(
          `Processing first ${MAX_PHOTOS_PER_BATCH} photos. Please add remaining photos in smaller batches.`
        );
      }

      setUploadProgress({ processed: 0, total: filesToProcess.length });

      // Process each file in the batch
      Promise.all(
        filesToProcess.map(async (file) => {
          // Get EXIF data for date taken
          const dateTaken = await getDateTaken(file);
          const originalDate =
            dateTaken || new Date(file.lastModified).toISOString();

          // Create object URL for preview
          const preview = URL.createObjectURL(file);

          setUploadProgress((prev) => ({
            processed: (prev?.processed || 0) + 1,
            total: prev?.total || filesToProcess.length,
          }));

          return {
            file,
            preview,
            dateTaken: originalDate,
            originalDate,
            isNew: true,
            isExisting: false,
            isDateModified: false,
          } as Photo;
        })
      ).then((newPhotos) => {
        onPhotosChange([...photos, ...newPhotos]);
        setUploadProgress(null);
      });
    },
    [photos, onPhotosChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".heic"],
    },
    onDrop,
  });

  const handleDateChange = useCallback(
    (index: number, newDate: string) => {
      const photo = photos[index];

      // Store the original date if this is the first modification
      if (!photo.originalDate) {
        photo.originalDate = photo.dateTaken;
      }

      // Update the photo's date and mark it as modified if different from original
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
      onCustomDatesChange?.({
        ...customDates,
        [photo.file.name]: newDate,
      });
      setEditingPhotoIndex(null);
    },
    [photos, customDates, onCustomDatesChange, onPhotosChange]
  );

  const getPhotoDate = useCallback(
    (photo: Photo) => {
      return customDates[photo.file.name] || photo.dateTaken;
    },
    [customDates]
  );

  const DateEditor = ({ photo, index }: { photo: Photo; index: number }) => {
    const currentDate = new Date(getPhotoDate(photo));
    const [month, setMonth] = useState(() => currentDate.getMonth() + 1);
    const [year, setYear] = useState(() => currentDate.getFullYear());

    // Scroll the modal into view when it opens
    useEffect(() => {
      const modalElement = document.getElementById(`date-editor-${index}`);
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, [index]);

    return (
      <div
        id={`date-editor-${index}`}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      >
        <div className="w-full max-w-sm bg-white rounded-lg p-6 space-y-6 md:space-y-4 md:w-auto md:p-4">
          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Edit Date</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose when this photo should appear
            </p>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2 md:mb-1 md:text-xs">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 md:px-2 md:py-1 text-base md:text-sm border rounded-lg md:rounded touch-manipulation"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {format(new Date(2024, m - 1), "MMMM")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2 md:mb-1 md:text-xs">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 md:px-2 md:py-1 text-base md:text-sm border rounded-lg md:rounded touch-manipulation"
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 md:mt-4">
            <button
              onClick={() => setEditingPhotoIndex(null)}
              className="flex-1 px-5 py-3 md:px-3 md:py-1 text-base md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg md:rounded hover:bg-gray-200 active:scale-95 transition-transform touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const newDate = new Date(year, month - 1).toISOString();
                handleDateChange(index, newDate);
              }}
              className="flex-1 px-5 py-3 md:px-3 md:py-1 text-base md:text-sm font-medium text-white bg-blue-600 rounded-lg md:rounded hover:bg-blue-700 active:scale-95 transition-transform touch-manipulation"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const newFiles = Array.from(e.target.files);
    const newTotalSize =
      currentSize + newFiles.reduce((sum, file) => sum + file.size, 0);

    if (maxTotalSize && newTotalSize > maxTotalSize) {
      alert(
        `Cannot add these photos. Total size would exceed ${maxTotalSize / 1024 / 1024}MB limit.`
      );
      return;
    }

    // Validate file sizes and types
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = newFiles.filter((file) => {
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
    });

    // Process in batches if needed
    const filesToProcess = validFiles.slice(
      0,
      Math.min(MAX_PHOTOS_PER_BATCH, MAX_TOTAL_PHOTOS - photos.length)
    );
    if (validFiles.length > MAX_PHOTOS_PER_BATCH) {
      alert(
        `Processing first ${MAX_PHOTOS_PER_BATCH} photos. Please add remaining photos in smaller batches.`
      );
    }

    setUploadProgress({ processed: 0, total: filesToProcess.length });

    // Process each file in the batch
    Promise.all(
      filesToProcess.map(async (file) => {
        // Get EXIF data for date taken
        const dateTaken = await getDateTaken(file);
        const originalDate =
          dateTaken || new Date(file.lastModified).toISOString();

        // Create object URL for preview
        const preview = URL.createObjectURL(file);

        setUploadProgress((prev) => ({
          processed: (prev?.processed || 0) + 1,
          total: prev?.total || filesToProcess.length,
        }));

        return {
          file,
          preview,
          dateTaken: originalDate,
          originalDate,
          isNew: true,
          isExisting: false,
          isDateModified: false,
        } as Photo;
      })
    ).then((newPhotos) => {
      onPhotosChange([...photos, ...newPhotos]);
      setUploadProgress(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Photos ({photos.length})</h3>
        <span className="text-sm text-gray-500">
          {MAX_TOTAL_PHOTOS - photos.length} slots remaining
        </span>
      </div>

      {uploadProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Processing photos...</span>
            <span className="text-sm text-gray-600">
              {uploadProgress.processed} / {uploadProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.processed / uploadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <input {...getInputProps()} />
        <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-4 text-gray-600">
          Drag & drop photos here, or click to select
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Maximum {MAX_TOTAL_PHOTOS} photos, {MAX_PHOTOS_PER_BATCH} at a time
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
              <div
                className={`absolute inset-0 rounded-lg ring-2 transition-colors ${
                  photo.isNew
                    ? "ring-blue-400/50 shadow-[0_0_0_1px_rgba(96,165,250,0.1)]"
                    : photo.isDateModified
                      ? "ring-amber-500 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
                      : "ring-gray-200/50"
                }`}
              >
                <img
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />

                {photo.isDateModified && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                    Date Modified
                  </div>
                )}
              </div>

              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingPhotoIndex(index)}
                  className={`p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100 ${
                    photo.isDateModified ? "ring-2 ring-amber-300/50" : ""
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const updatedDates = { ...customDates };
                    delete updatedDates[photo.file.name];
                    onCustomDatesChange?.(updatedDates);
                    onPhotosChange(photos.filter((_, i) => i !== index));
                  }}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-xs text-white">
                  {format(new Date(getPhotoDate(photo)), "MMMM yyyy")}
                </p>
              </div>

              {editingPhotoIndex === index && (
                <DateEditor photo={photo} index={index} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
