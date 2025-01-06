import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { format, parse } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Photo {
  file: File;
  preview: string;
  dateTaken: string;
  id?: string;
}

interface MonthlyCollageProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

const PREVIEW_CACHE_KEY = "photo-preview-cache";

const normalizeDate = (date: string | Date): string => {
  const d = new Date(date);
  // Ensure date is valid
  if (isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
};

const MonthlyCollage: React.FC<MonthlyCollageProps> = ({
  photos,
  onPhotosChange,
}) => {
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  // Generate consistent IDs for photos
  const photoIds = useMemo(() => {
    return photos.map((photo) => ({
      id: photo.id || `${photo.file.name}-${photo.file.lastModified}`,
      preview: photo.preview,
    }));
  }, [photos]);

  // Load cached previews on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(PREVIEW_CACHE_KEY);
      if (cached) {
        setPreviewCache(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Failed to load preview cache:", error);
    }
  }, []);

  // Ensure each photo has a unique ID
  const photosWithIds = useMemo(() => {
    return photos.map((photo, index) => {
      const { id } = photoIds[index];
      const normalizedDate = normalizeDate(photo.dateTaken);

      return {
        ...photo,
        id,
        preview: previewCache[id] || photo.preview,
        dateTaken: normalizedDate,
      };
    });
  }, [photos, photoIds, previewCache]);

  // Update preview cache when photos change
  useEffect(() => {
    const newCache = { ...previewCache };
    let hasChanges = false;

    photoIds.forEach(({ id, preview }) => {
      if (!newCache[id] && preview) {
        newCache[id] = preview;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setPreviewCache(newCache);
      try {
        localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(newCache));
      } catch (error) {
        console.error("Failed to cache preview:", error);
      }
    }
  }, [photoIds, previewCache]);

  // Cleanup preview URLs when component unmounts or photos change
  useEffect(() => {
    const currentPreviews = new Set(photosWithIds.map((p) => p.preview));
    const previewUrlsRefValue = previewUrlsRef.current;

    if (previewUrlsRefValue) {
      Array.from(previewUrlsRefValue).forEach((preview) => {
        if (!currentPreviews.has(preview)) {
          URL.revokeObjectURL(preview);
          previewUrlsRefValue.delete(preview);
        }
      });

      currentPreviews.forEach((preview) => {
        previewUrlsRefValue.add(preview);
      });
    }

    return () => {
      if (previewUrlsRefValue) {
        Array.from(previewUrlsRefValue).forEach((url) => {
          URL.revokeObjectURL(url);
        });
        previewUrlsRefValue.clear();
      }
    };
  }, [photosWithIds]);

  const photosByMonth = useMemo(() => {
    return photosWithIds.reduce((acc, photo) => {
      const month = new Date(normalizeDate(photo.dateTaken))
        .toISOString()
        .slice(0, 7);
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(photo);
      return acc;
    }, {} as Record<string, Photo[]>);
  }, [photosWithIds]);

  const sortedMonths = useMemo(() => {
    return Object.keys(photosByMonth).sort().reverse();
  }, [photosByMonth]);

  const handleMonthYearChange = useCallback(
    (photoId: string, monthYear: string) => {
      const updatedPhotos = photosWithIds.map((photo) => {
        if (photo.id === photoId) {
          const currentDate = new Date(normalizeDate(photo.dateTaken));
          const newDate = parse(monthYear, "yyyy-MM", new Date());
          newDate.setDate(currentDate.getDate());

          return {
            ...photo,
            dateTaken: normalizeDate(newDate),
          };
        }
        return photo;
      });

      onPhotosChange(updatedPhotos);
    },
    [photosWithIds, onPhotosChange]
  );

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {sortedMonths.map((month) => (
          <motion.div
            key={month}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium">
                {format(new Date(month), "MMMM yyyy")}
              </h3>
              <span className="text-sm text-gray-500">
                ({photosByMonth[month].length} photos)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {photosByMonth[month].map((photo) => (
                  <motion.div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                    layoutId={`photo-${photo.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Image
                      src={photo.preview}
                      alt={`Photo from ${format(
                        new Date(photo.dateTaken),
                        "MMMM yyyy"
                      )}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute inset-x-4 bottom-4">
                        <input
                          type="month"
                          value={photo.dateTaken.slice(0, 7)}
                          onChange={(e) =>
                            handleMonthYearChange(photo.id!, e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm bg-white rounded"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyCollage;
