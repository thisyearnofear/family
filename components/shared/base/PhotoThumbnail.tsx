import { format } from "date-fns";
import { useState } from "react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Photo } from "@utils/types/gift";

interface PhotoThumbnailProps {
  photo: Photo;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function PhotoThumbnail({
  photo,
  index,
  onEdit,
  onDelete,
}: PhotoThumbnailProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-square group">
      <div
        className={`absolute inset-0 rounded-lg ring-2 transition-colors ${
          hasError
            ? "ring-red-400 bg-red-50"
            : photo.isNew
              ? "ring-blue-400/50 shadow-[0_0_0_1px_rgba(96,165,250,0.1)]"
              : photo.isDateModified
                ? "ring-amber-500 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
                : "ring-gray-200/50"
        }`}
      >
        {!isImageLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 rounded-lg p-4">
            <XMarkIcon className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm text-red-700 text-center">
              Failed to load image
            </p>
          </div>
        ) : (
          <img
            src={photo.preview}
            alt={`Preview ${index + 1}`}
            className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsImageLoaded(true);
            }}
          />
        )}

        {photo.isDateModified && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
            Date Modified
          </div>
        )}

        {photo.isNew && !photo.isDateModified && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            New
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(index)}
          className={`p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100 ${
            photo.isDateModified ? "ring-2 ring-amber-300/50" : ""
          }`}
          disabled={hasError}
          title={hasError ? "Cannot edit date of failed image" : "Edit date"}
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          title={hasError ? "Remove failed image" : "Remove photo"}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {!hasError && isImageLoaded && (
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-xs text-white">
            {format(new Date(photo.dateTaken), "MMMM yyyy")}
          </p>
        </div>
      )}
    </div>
  );
}
