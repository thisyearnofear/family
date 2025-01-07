import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { format } from "date-fns";
import {
  PhotoIcon,
  XMarkIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import type { Photo } from "@utils/types/gift";

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates?: { [filename: string]: string };
  onCustomDatesChange?: (dates: { [filename: string]: string }) => void;
  maxPhotos?: number;
}

const MAX_TOTAL_PHOTOS = 30;

export function PhotoUpload({
  photos,
  onPhotosChange,
  customDates = {},
  onCustomDatesChange,
  maxPhotos = MAX_TOTAL_PHOTOS,
}: PhotoUploadProps) {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null
  );
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Cleanup preview URLs when component unmounts or photos change
  useEffect(() => {
    // Cleanup old previews
    previewUrls.forEach(URL.revokeObjectURL);

    // Create new previews
    const newPreviews = photos.map((photo) => {
      if (photo.preview.startsWith("blob:")) {
        return photo.preview;
      }
      return URL.createObjectURL(photo.file);
    });
    setPreviewUrls(newPreviews);

    return () => {
      newPreviews.forEach(URL.revokeObjectURL);
    };
  }, [photos]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) return;

      // Take only what we can fit
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      // Create all photo objects first
      const newPhotos = filesToProcess.map((file) => ({
        file,
        preview: "", // Will be set by useEffect
        dateTaken: new Date(file.lastModified).toISOString(),
      }));

      // Update state once with all new photos
      onPhotosChange([...photos, ...newPhotos]);
    },
    [photos, onPhotosChange, maxPhotos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
  });

  const handleDateChange = useCallback(
    (index: number, newDate: string) => {
      const photo = photos[index];
      onCustomDatesChange?.({
        ...customDates,
        [photo.file.name]: newDate,
      });
      setEditingPhotoIndex(null);
    },
    [photos, customDates, onCustomDatesChange]
  );

  const getPhotoDate = useCallback(
    (photo: Photo) => {
      return customDates[photo.file.name] || photo.dateTaken;
    },
    [customDates]
  );

  const renderPhotoUploadGuidance = () => (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-700 text-center">
      <p>Photos will be organized by date in your gift experience.</p>
      <ul className="mt-2 space-y-1">
        <li>• Click the calendar icon to adjust photo dates</li>
        <li>• Default dates are taken from photo metadata</li>
      </ul>
      {photos.length >= maxPhotos * 0.8 && (
        <p className="mt-2 text-amber-600 font-medium">
          {photos.length === maxPhotos
            ? "Maximum number of photos reached"
            : `Getting close to the photo limit (${photos.length}/${maxPhotos})`}
        </p>
      )}
    </div>
  );

  const DateEditor = ({ photo, index }: { photo: Photo; index: number }) => {
    const currentDate = new Date(getPhotoDate(photo));
    const [month, setMonth] = useState(() => currentDate.getMonth() + 1);
    const [year, setYear] = useState(() => currentDate.getFullYear());

    return (
      <div className="fixed inset-0 z-50 md:absolute md:inset-0 bg-black/80 flex items-end md:items-center justify-center">
        <div
          className="w-full max-w-sm bg-white rounded-t-2xl md:rounded-lg p-6 space-y-6 md:space-y-4 md:w-auto md:p-4"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
          }}
        >
          {/* Title */}
          <div className="text-center md:hidden">
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
          <div className="flex gap-3 mt-6 md:mt-4 md:justify-end">
            <button
              onClick={() => setEditingPhotoIndex(null)}
              className="flex-1 md:flex-initial px-5 py-3 md:px-3 md:py-1 text-base md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg md:rounded hover:bg-gray-200 active:scale-95 transition-transform touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const newDate = new Date(year, month - 1).toISOString();
                handleDateChange(index, newDate);
              }}
              className="flex-1 md:flex-initial px-5 py-3 md:px-3 md:py-1 text-base md:text-sm font-medium text-white bg-blue-600 rounded-lg md:rounded hover:bg-blue-700 active:scale-95 transition-transform touch-manipulation"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderPhotoUploadGuidance()}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : photos.length >= maxPhotos
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} disabled={photos.length >= maxPhotos} />
        <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">
          {photos.length >= maxPhotos
            ? "Maximum number of photos reached"
            : "Drag & drop photos here, or click to select"}
        </p>
        {photos.length >= maxPhotos * 0.8 && photos.length < maxPhotos && (
          <p className="mt-2 text-xs text-amber-600">
            You can add {maxPhotos - photos.length} more photos
          </p>
        )}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
              {previewUrls[index] && (
                <Image
                  src={previewUrls[index]}
                  alt={`Uploaded photo ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingPhotoIndex(index)}
                  className="p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100"
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
                  {customDates[photo.file.name] && (
                    <span className="text-yellow-300 ml-1">•</span>
                  )}
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
