export const UPLOAD_LIMITS = {
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
  MAX_SINGLE_FILE: 10 * 1024 * 1024, // 10MB per photo
  MAX_PHOTOS: 30, // Maximum number of photos
  BATCH_SIZE: 5, // Process 5 at a time
  CACHE_AGE: 60 * 60 * 1000, // 1 hour cache
} as const;

// Helper functions for formatting
export const formatFileSize = (bytes: number): string => {
  const mb = Math.round(bytes / 1024 / 1024);
  return `${mb}MB`;
};

export const getFileSizeError = (fileSize: number): string | null => {
  if (fileSize > UPLOAD_LIMITS.MAX_SINGLE_FILE) {
    return `File size (${formatFileSize(fileSize)}) exceeds the ${formatFileSize(UPLOAD_LIMITS.MAX_SINGLE_FILE)} limit`;
  }
  return null;
};
