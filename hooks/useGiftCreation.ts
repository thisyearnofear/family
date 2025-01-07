import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { createGift } from "@utils/api/pinata";
import { copyToClipboard, downloadGiftInfo } from "@utils/helpers";
import type { Photo, UploadStatus, GiftTheme } from "@utils/types/gift";

interface UseGiftCreationProps {
  onGiftCreated: (giftId: string) => void;
}

export function useGiftCreation({ onGiftCreated }: UseGiftCreationProps) {
  const { address, isConnected } = useAccount();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    status: "idle",
    progress: 0,
  });

  // Debounced progress update to prevent too many re-renders
  const updateProgress = useCallback((progress: any) => {
    setUploadStatus((prev) => {
      // Skip update if progress hasn't changed significantly (less than 5%)
      if (
        progress.status === prev.status &&
        progress.uploadedFiles === prev.uploadedFiles
      ) {
        return prev;
      }

      const currentProgress = prev.progress || 0;
      const newProgress =
        progress.status === "uploading"
          ? (progress.uploadedFiles / progress.totalFiles) * 70
          : progress.status === "verifying"
            ? 85
            : progress.status === "pending"
              ? 95
              : progress.status === "ready"
                ? 100
                : currentProgress;

      // Only update if progress has changed significantly
      if (
        Math.abs(newProgress - currentProgress) < 5 &&
        progress.status === prev.status
      ) {
        return prev;
      }

      return {
        ...prev,
        uploadedFiles: progress.uploadedFiles,
        totalFiles: progress.totalFiles,
        status: progress.status,
        isUploading: progress.status !== "ready",
        progress: newProgress,
      };
    });
  }, []);

  const handleCreateGift = async (
    photos: Photo[],
    theme: GiftTheme,
    messages: string[],
    selectedSongs: string[],
    title: string,
    customDates: { [key: string]: string },
    predefinedGiftId?: string
  ) => {
    try {
      setUploadStatus((prev) => ({
        ...prev,
        isUploading: true,
        status: "uploading",
        totalFiles: photos.length,
        uploadedFiles: 0,
      }));

      // Create gift with predefined ID if provided
      const giftId =
        predefinedGiftId ||
        `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const result = await createGift(
        photos.map((p) => p.file),
        theme,
        messages,
        selectedSongs,
        title,
        customDates,
        isConnected ? address : undefined,
        updateProgress
      );

      setUploadStatus((prev) => ({
        ...prev,
        giftId: result.giftId,
        progress: 100,
        status: "ready",
        isUploading: false,
      }));

      await copyToClipboard(result.giftId);
      onGiftCreated(result.giftId);

      // Store gift ID in local storage for unwrapping later
      if (typeof window !== "undefined") {
        const createdGifts = JSON.parse(
          localStorage.getItem("createdGifts") || "[]"
        );
        createdGifts.push({
          id: result.giftId,
          createdAt: new Date().toISOString(),
          theme,
        });
        localStorage.setItem("createdGifts", JSON.stringify(createdGifts));
      }
    } catch (error) {
      console.error("Error creating gift:", error);
      setUploadStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to create gift",
        status: "error",
        isUploading: false,
      }));
    }
  };

  const handleDownload = useCallback((giftId: string, theme: GiftTheme) => {
    downloadGiftInfo(giftId, theme);
  }, []);

  return {
    uploadStatus,
    handleCreateGift,
    handleDownload,
    setUploadStatus,
  };
}
