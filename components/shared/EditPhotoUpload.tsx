import React, { useState, useCallback } from "react";
import { BasePhotoUpload } from "./base/BasePhotoUpload";
import { BaseProgressiveImage } from "./base/ProgressiveImage";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { PhotoDateEditor } from "./base/PhotoDateEditor";
import type { Photo } from "@utils/types/gift";

interface EditPhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  customDates?: { [key: string]: string };
  onCustomDatesChange?: (dates: { [key: string]: string }) => void;
  isPreviewMode?: boolean;
}

const renderPhoto = (
  photo: Photo,
  index: number,
  onDelete: (index: number) => void,
  onEditDate: (index: number) => void,
  isPreviewMode?: boolean
): React.ReactElement => {
  // Format dates for display
  const formattedOriginalDate = photo.originalDate
    ? new Date(photo.originalDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;

  const formattedCurrentDate = new Date(photo.dateTaken).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
    }
  );

  // Generate a unique key for the photo
  const photoKey = photo.ipfsHash || photo.file.name + "-" + index;

  return (
    <div
      key={photoKey}
      className="relative aspect-square group overflow-visible"
      data-testid={`photo-${index}`}
      data-modified={photo.isDateModified}
      data-deleted={photo.isDeleted}
      data-new={photo.isNew}
    >
      <BaseProgressiveImage
        src={photo.preview}
        alt={`Photo ${index + 1}`}
        width={400}
        height={400}
        className={`w-full h-full object-cover rounded-lg transition-opacity ${
          photo.isDeleted ? "opacity-50" : ""
        }`}
        quality={75}
        placeholder="blur"
        blurDataURL={photo.preview}
      />
      {/* Status Indicators */}
      {!isPreviewMode &&
        (photo.isNew || photo.isDateModified || photo.isDeleted) && (
          <div className="absolute top-2 left-2 flex gap-2 z-10">
            {photo.isNew && (
              <div className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-sm">
                New
              </div>
            )}
            {photo.isDateModified && (
              <div className="bg-amber-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>Modified</span>
              </div>
            )}
            {photo.isDeleted && (
              <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-sm">
                To Be Deleted
              </div>
            )}
          </div>
        )}
      {/* Action Buttons */}
      {!isPreviewMode && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDate(index);
            }}
            className="p-1.5 rounded-full bg-blue-500/90 hover:bg-blue-600/90 backdrop-blur-sm text-white shadow-sm transition-colors"
            title="Edit Date"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className={`p-1.5 rounded-full 
              ${
                photo.isDeleted
                  ? "bg-gray-500/90 hover:bg-gray-600/90"
                  : "bg-red-500/90 hover:bg-red-600/90"
              } 
              backdrop-blur-sm text-white shadow-sm transition-colors`}
            title={photo.isDeleted ? "Undo Delete" : "Delete Photo"}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Date Display */}
      <div className="absolute bottom-2 left-2 right-2 z-10">
        {photo.isDateModified && formattedOriginalDate && (
          <div className="text-xs text-white/80 bg-black/30 px-2 py-0.5 rounded-t backdrop-blur-sm line-through mb-px">
            {formattedOriginalDate}
          </div>
        )}
        <div
          className={`text-xs text-white bg-black/50 px-2 py-1 backdrop-blur-sm ${
            photo.isDateModified ? "rounded-b" : "rounded"
          }`}
        >
          {formattedCurrentDate}
        </div>
      </div>
    </div>
  );
};

export function EditPhotoUpload({
  photos,
  onPhotosChange,
  customDates,
  onCustomDatesChange,
  isPreviewMode,
}: EditPhotoUploadProps): React.ReactElement {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null
  );

  const handleDelete = useCallback(
    (index: number) => {
      const updatedPhotos = photos.map((photo, i) =>
        i === index ? { ...photo, isDeleted: !photo.isDeleted } : photo
      );
      onPhotosChange(updatedPhotos);
    },
    [photos, onPhotosChange]
  );

  const handleDateChange = useCallback(
    (index: number, newDate: string) => {
      const updatedPhotos = photos.map((p, i) => {
        if (i !== index) return p;

        // Ensure we have an originalDate to compare against
        const originalDate = p.originalDate || p.dateTaken;

        // Create a new photo object with updated properties
        const updatedPhoto = {
          ...p,
          dateTaken: newDate,
          originalDate: originalDate,
          isDateModified: newDate !== originalDate,
        };

        // Debug log to verify state changes
        console.log("Photo date update:", {
          index,
          originalDate,
          newDate,
          isModified: updatedPhoto.isDateModified,
        });

        return updatedPhoto;
      });

      onPhotosChange(updatedPhotos);
      if (onCustomDatesChange && customDates) {
        const newDates = { ...customDates, [photos[index].file.name]: newDate };
        onCustomDatesChange(newDates);
      }
      setEditingPhotoIndex(null);
    },
    [photos, customDates, onCustomDatesChange, onPhotosChange]
  );

  const renderPhotoWithHandlers = useCallback(
    (photo: Photo, index: number) =>
      renderPhoto(
        photo,
        index,
        handleDelete,
        () => setEditingPhotoIndex(index),
        isPreviewMode
      ),
    [handleDelete, isPreviewMode]
  );

  return (
    <>
      <BasePhotoUpload
        photos={photos}
        onPhotosChange={onPhotosChange}
        renderPhoto={renderPhotoWithHandlers}
        customDates={customDates}
        onCustomDatesChange={onCustomDatesChange}
        isPreviewMode={isPreviewMode}
      />
      {!isPreviewMode && editingPhotoIndex !== null && (
        <PhotoDateEditor
          dateTaken={photos[editingPhotoIndex].dateTaken}
          onDateChange={(newDate) =>
            handleDateChange(editingPhotoIndex, newDate)
          }
          onClose={() => setEditingPhotoIndex(null)}
        />
      )}
    </>
  );
}
