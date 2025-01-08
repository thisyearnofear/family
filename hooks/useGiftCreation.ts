import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { copyToClipboard, downloadGiftInfo } from "@utils/helpers";
import type { Photo, UploadStatus, GiftTheme } from "@utils/types/gift";

// Helper function to create a gift
async function createGift(
  files: File[],
  theme: GiftTheme,
  messages: string[],
  selectedSongs: string[],
  title: string,
  customDates: { [key: string]: string },
  ownerAddress?: string,
  onProgress?: (progress: any) => void
) {
  try {
    // Upload each photo and track progress
    const uploadedPhotos = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          name: `${title} - Photo ${i + 1}`,
          keyvalues: {
            type: "photo",
            theme,
            index: i,
            date: customDates[file.name] || new Date().toISOString(),
          },
        })
      );

      const response = await fetch("/api/pinata/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload photo ${i + 1}`);
      }

      const { ipfsHash } = await response.json();
      uploadedPhotos.push({
        ipfsHash,
        name: file.name,
        date: customDates[file.name] || new Date().toISOString(),
      });

      // Report progress
      onProgress?.({
        status: "uploading",
        uploadedFiles: i + 1,
        totalFiles: files.length,
      });
    }

    // Create metadata
    const metadata = {
      name: `${title} Metadata`,
      keyvalues: {
        type: "metadata",
        theme,
        owner: ownerAddress || "",
        music: JSON.stringify(selectedSongs),
        title,
      },
    };

    // Upload metadata
    const metadataContent = {
      title,
      theme,
      images: uploadedPhotos,
      messages,
      music: selectedSongs,
      owner: ownerAddress || "",
      editors: [],
      pendingInvites: [],
      version: 1,
      lastModified: new Date().toISOString(),
    };

    const metadataForm = new FormData();
    metadataForm.append(
      "file",
      new Blob([JSON.stringify(metadataContent)], {
        type: "application/json",
      })
    );
    metadataForm.append("metadata", JSON.stringify(metadata));

    onProgress?.({ status: "verifying" });

    const metadataResponse = await fetch("/api/pinata/upload", {
      method: "POST",
      body: metadataForm,
    });

    if (!metadataResponse.ok) {
      throw new Error("Failed to upload metadata");
    }

    onProgress?.({ status: "ready" });

    return { giftId: metadataContent.title };
  } catch (error) {
    console.error("Error creating gift:", error);
    throw error;
  }
}

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

      // Calculate new progress percentage
      let newProgress = 0;
      if (progress.status === "uploading" && progress.totalFiles > 0) {
        newProgress = Math.floor((progress.uploadedFiles / progress.totalFiles) * 70);
      } else if (progress.status === "verifying") {
        newProgress = 85;
      } else if (progress.status === "pending") {
        newProgress = 95;
      } else if (progress.status === "ready") {
        newProgress = 100;
      }

      // Only update if progress has changed significantly
      const currentProgress = typeof prev.progress === 'number' ? prev.progress : 0;
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
