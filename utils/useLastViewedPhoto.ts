import { useCallback, useEffect, useState } from "react";

const LAST_VIEWED_PHOTO = "last_viewed_photo";

export function useLastViewedPhoto(): [
  string | null,
  (photoId: string | string[] | null) => void
] {
  const [lastViewedPhoto, setLastViewedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const lastViewed = localStorage.getItem(LAST_VIEWED_PHOTO);
    if (lastViewed) {
      setLastViewedPhoto(lastViewed);
    }
  }, []);

  const setLastViewed = useCallback((photoId: string | string[] | null) => {
    if (!photoId) {
      localStorage.removeItem(LAST_VIEWED_PHOTO);
      setLastViewedPhoto(null);
    } else {
      const id = Array.isArray(photoId) ? photoId[0] : photoId;
      localStorage.setItem(LAST_VIEWED_PHOTO, id);
      setLastViewedPhoto(id);
    }
  }, []);

  return [lastViewedPhoto, setLastViewed];
}
