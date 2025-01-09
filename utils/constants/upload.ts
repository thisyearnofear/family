export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB per image
export const CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
];

// For better user feedback
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const getFileSizeError = (fileSize: number): string | null => {
  if (fileSize > MAX_IMAGE_SIZE) {
    return `File size (${formatFileSize(fileSize)}) exceeds the ${formatFileSize(MAX_IMAGE_SIZE)} limit`;
  }
  return null;
};
