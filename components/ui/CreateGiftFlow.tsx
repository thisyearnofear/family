import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useWriteContract, useWatchContractEvent } from "wagmi";
import type { Hash } from "viem";
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from "@utils/constants";
import { createGiftData } from "@utils/helpers";
import type {
  Step,
  Photo,
  GiftTheme,
  CreateGiftData,
  CurrentInvite,
  Role,
  UploadStatus,
} from "@utils/types/gift";
import { GiftFlowLayout } from "@components/shared/GiftFlowLayout";
import { ThemeSelection } from "@components/shared/ThemeSelection";
import { PhotoUpload } from "@components/shared/PhotoUpload";
import { MessageInput } from "@components/shared/MessageInput";
import { MusicSelection } from "@components/shared/MusicSelection";
import { WalletConnection } from "@components/shared/WalletConnection";
import { UploadStatusOverlay } from "@components/shared/UploadStatusOverlay";
import { useGiftCreation } from "@hooks/useGiftCreation";
import { copyToClipboard } from "@utils/helpers";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { TitleInput } from "@components/shared/TitleInput";
import { Web3Features } from "@components/shared/Web3Features";
import { PermissionsManager } from "@components/shared/PermissionsManager";
import { CollaboratorInput } from "@components/shared/CollaboratorInput";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Message } from "@utils/types/message";
import { Song } from "@utils/types/song";
import { usePhotoStorage } from "@hooks/usePhotoStorage";

const STEPS: Step[] = [
  "theme",
  "photos",
  "messages",
  "music",
  "wallet",
  "collaborators",
  "permissions",
  "preview",
  "confirm",
];

interface CreateGiftFlowProps {
  onComplete: (data: CreateGiftData) => Promise<void>;
  onClose: () => void;
  onGiftCreated: (giftId: string) => void;
}

interface MessageInputProps {
  messages: string[];
  onMessagesChange: (messages: string[]) => void;
}

interface MusicSelectionProps {
  selectedSongs: string[];
  onSongSelect: (songs: string[]) => void;
}

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

export default function CreateGiftFlow({
  onComplete,
  onClose,
  onGiftCreated,
}: CreateGiftFlowProps) {
  const draftId = useMemo(() => `draft-${Date.now()}`, []);
  const {
    isLoading: isLoadingPhotos,
    savePhotos,
    loadPhotos,
    clearPhotos,
    clearAllPhotos,
  } = usePhotoStorage(draftId);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    isUploading: false,
  });

  const [currentInvites, setCurrentInvites] = useState<CurrentInvite[]>([]);

  // Always start at theme selection
  const [step, setStep] = useState<Step>("theme");

  // Load other state from local storage or use defaults
  const [theme, setTheme] = useState<GiftTheme>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.theme || "space";
    }
    return "space";
  });

  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return (
        parsed.photos?.map((photo: any) => ({
          ...photo,
          file: new File([], photo.fileName),
          preview: photo.preview,
        })) || []
      );
    }
    return [];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.messages || [];
    }
    return [];
  });

  const [selectedSongs, setSelectedSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.selectedSongs || [];
    }
    return [];
  });

  const [title, setTitle] = useState<string>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.title || "A Year in Memories";
    }
    return "A Year in Memories";
  });

  const [customDates, setCustomDates] = useState<{
    [filename: string]: string;
  }>(() => {
    const saved = localStorage.getItem("draftGift");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.customDates || {};
    }
    return {};
  });

  // Load photos from IndexedDB on mount
  useEffect(() => {
    const loadSavedPhotos = async () => {
      const savedPhotos = await loadPhotos();
      if (savedPhotos.length > 0) {
        setPhotos(savedPhotos);
      }
    };
    loadSavedPhotos();
  }, [loadPhotos]);

  // Save photos to IndexedDB whenever they change
  useEffect(() => {
    if (photos.length > 0) {
      savePhotos(photos);
    }
  }, [photos, savePhotos]);

  // Clear photos from IndexedDB when gift is created
  useEffect(() => {
    if (uploadStatus.status === "ready") {
      clearPhotos();
      localStorage.removeItem("draftGift");
    }
  }, [uploadStatus.status, clearPhotos]);

  // Save draft state to local storage whenever it changes
  useEffect(() => {
    const draftState = {
      step,
      theme,
      photos: photos.map((photo) => ({
        ...photo,
        fileName: photo.file.name,
        preview: photo.preview,
      })),
      messages,
      selectedSongs,
      title,
      customDates,
      currentInvites,
    };
    localStorage.setItem("draftGift", JSON.stringify(draftState));
  }, [
    step,
    theme,
    photos,
    messages,
    selectedSongs,
    title,
    customDates,
    currentInvites,
  ]);

  // Clear draft state when gift is created successfully
  useEffect(() => {
    if (uploadStatus.status === "ready") {
      localStorage.removeItem("draftGift");
    }
  }, [uploadStatus.status]);

  const { address, isConnected } = useAccount();

  const [txStatus, setTxStatus] = useState<{
    isConfirming: boolean;
    isConfirmed: boolean;
    hash?: string;
  }>({
    isConfirming: false,
    isConfirmed: false,
  });

  // Add total size tracking
  const totalSize = useMemo(
    () => photos.reduce((sum, photo) => sum + photo.file.size, 0),
    [photos]
  );

  const sizePercentage = useMemo(
    () => (totalSize / MAX_TOTAL_SIZE) * 100,
    [totalSize]
  );

  // Enhanced photo change handler
  const handlePhotosChange = useCallback((newPhotos: Photo[]) => {
    const newTotalSize = newPhotos.reduce(
      (sum, photo) => sum + photo.file.size,
      0
    );
    if (newTotalSize > MAX_TOTAL_SIZE) {
      alert(
        `Cannot add more photos. Total size would exceed ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit.`
      );
      return;
    }
    setPhotos(newPhotos);
  }, []);

  const handleCreateGift = async (
    photos: Photo[],
    theme: string,
    messages: Message[],
    selectedSongs: Song[],
    title: string,
    customDates: { [key: string]: string },
    giftId?: string
  ) => {
    try {
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        status: "uploading",
        isUploading: true,
        message: "Uploading photos to IPFS...",
        uploadedFiles: 0,
        totalFiles: photos.length,
      }));

      // Upload photos to IPFS first
      const uploadedPhotos = await Promise.all(
        photos.map(async (photo, index) => {
          try {
            const formData = new FormData();
            formData.append("file", photo.file);

            const response = await fetch("/api/pinata/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Failed to upload photo: ${response.statusText}`);
            }

            const { ipfsHash } = await response.json();

            // Update progress
            setUploadStatus((prev: UploadStatus) => ({
              ...prev,
              uploadedFiles: (prev.uploadedFiles || 0) + 1,
              message: `Uploading photos to IPFS (${index + 1}/${photos.length})...`,
            }));

            return {
              ...photo,
              ipfsHash,
            };
          } catch (error) {
            console.error("Error uploading photo:", error);
            throw new Error(
              `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        })
      );

      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        status: "verifying",
        message: "Creating gift metadata...",
      }));

      // Create gift metadata
      const metadata = {
        title,
        theme,
        giftId:
          giftId || `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        photos: uploadedPhotos.map((photo) => photo.ipfsHash),
        messages,
        music: selectedSongs.map((song) => song.path),
        dateTaken: Object.values(customDates)[0] || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        version: "1.0",
      };

      // Upload metadata to IPFS
      const metadataResponse = await fetch("/api/pinata/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(
          `Failed to upload gift metadata: ${error.message || error.error || "Unknown error"}`
        );
      }

      const { ipfsHash: metadataHash } = await metadataResponse.json();

      // Clear local storage
      localStorage.removeItem("draftGift");

      // Update upload status with success state
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        status: "ready",
        isUploading: false,
        message: "Gift created successfully!",
        giftId: metadata.giftId,
        ipfsHash: metadataHash,
        uploadedFiles: photos.length,
        totalFiles: photos.length,
      }));

      // Notify parent component
      onGiftCreated(metadata.giftId);

      // Copy gift ID to clipboard
      await copyToClipboard(metadata.giftId);
    } catch (error) {
      console.error("Error in handleCreateGift:", error);
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Failed to create gift",
      }));

      // Throw error to be handled by parent
      throw error;
    }
  };

  const { handleDownload } = useGiftCreation({
    onGiftCreated,
  });

  // Contract interaction hooks
  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess: (hash: Hash) => {
        setTxStatus((prev) => ({
          ...prev,
          isConfirming: true,
          hash,
        }));
      },
    },
  });

  // Watch for invite creation events
  useWatchContractEvent({
    address: FAMILE_INVITES_ADDRESS,
    abi: FAMILE_INVITES_ABI,
    eventName: "InviteCreated",
    onLogs(logs) {
      const inviteEvent = logs[0];
      if (
        inviteEvent &&
        inviteEvent.args &&
        inviteEvent.args.to &&
        inviteEvent.args.role &&
        inviteEvent.args.expiresAt
      ) {
        const { inviteId, from, to, giftId, role, expiresAt } =
          inviteEvent.args;
        const newInvite: CurrentInvite = {
          address: to.toLowerCase(),
          role: role as Role,
          invitedAt: new Date().toISOString(),
          expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
          status: "pending",
        };
        handleInviteCreated(newInvite);
        console.log("New invite created", {
          inviteId,
          from,
          to,
          giftId,
          role,
          expiresAt,
        });
      }
      console.log("New invite created", logs);
    },
  });

  // Cleanup previews when photos change or component unmounts
  useEffect(() => {
    const oldPreviews = photos.map((p) => p.preview);
    return () => {
      oldPreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [photos]);

  const handleNextStep = useCallback(() => {
    const nextIndex = STEPS.indexOf(step) + 1;
    if (nextIndex < STEPS.length) {
      // If coming from wallet step and not connected, skip collaborator and permissions steps
      if (step === "wallet" && !isConnected) {
        const previewIndex = STEPS.indexOf("preview");
        setStep(STEPS[previewIndex]);
        return;
      }
      setStep(STEPS[nextIndex]);
    }
  }, [step, isConnected]);

  const handlePreviousStep = useCallback(() => {
    const prevIndex = STEPS.indexOf(step) - 1;
    if (prevIndex >= 0) {
      // If going back from preview/confirm and not connected, skip to wallet step
      if ((step === "preview" || step === "confirm") && !isConnected) {
        const walletIndex = STEPS.indexOf("wallet");
        setStep(STEPS[walletIndex]);
        return;
      }
      setStep(STEPS[prevIndex]);
    }
  }, [step, isConnected]);

  const handleComplete = async () => {
    try {
      // Validate photos before proceeding
      if (!photos.length) {
        throw new Error("Please add at least one photo");
      }

      // Validate photo sizes
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
      const totalSize = photos.reduce((sum, photo) => sum + photo.file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(
          `Total photo size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit`
        );
      }

      // If not connected, just do IPFS upload
      if (!isConnected) {
        await handleCreateGift(
          photos,
          theme,
          messages,
          selectedSongs,
          title,
          customDates
        );
        return;
      }

      // For connected users, show contract interaction UI first
      setUploadStatus((prev) => ({
        ...prev,
        status: "verifying",
        message: "Please sign transactions to create your gift",
      }));

      // First handle contract setup
      const giftId = `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        // Set gift ownership
        const setOwnerTx = await writeContract({
          address: FAMILE_INVITES_ADDRESS as `0x${string}`,
          abi: FAMILE_INVITES_ABI,
          functionName: "setGiftOwner",
          args: [giftId, address as `0x${string}`],
        });

        setTxStatus((prev) => ({
          ...prev,
          isConfirming: true,
          hash: typeof setOwnerTx === "string" ? setOwnerTx : undefined,
        }));

        // Create invites for collaborators
        for (const invite of currentInvites) {
          if (invite.status !== "removed") {
            await writeContract({
              address: FAMILE_INVITES_ADDRESS as `0x${string}`,
              abi: FAMILE_INVITES_ABI,
              functionName: "createInvite",
              args: [
                invite.address as `0x${string}`,
                giftId,
                invite.role,
                BigInt(7 * 24 * 60 * 60), // 7 days expiry
              ],
            });
          }
        }

        setTxStatus((prev) => ({
          ...prev,
          isConfirmed: true,
        }));

        // Then handle IPFS upload with the same giftId
        await handleCreateGift(
          photos,
          theme,
          messages,
          selectedSongs,
          title,
          customDates,
          giftId // Pass the giftId we created
        );
      } catch (error) {
        console.error("Contract interaction error:", error);
        setUploadStatus((prev) => ({
          ...prev,
          error: "Failed to set up gift ownership. Please try again.",
          status: "error",
        }));
        return;
      }
    } catch (error) {
      console.error("Error during gift creation:", error);
      setUploadStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to create gift",
        status: "error",
      }));

      // Show error UI with retry option
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Upload Failed</h3>
              <p className="text-gray-600">
                {error instanceof Error
                  ? error.message
                  : "Failed to create gift"}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() =>
                    setUploadStatus((prev) => ({ ...prev, status: "idle" }))
                  }
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const handleInviteCreated = (invite: CurrentInvite) => {
    setCurrentInvites((prev) => [...prev, invite]);
  };

  const handleMessageChange = (messages: string[]) => {
    setMessages(
      messages.map((content, index) => ({
        id: `msg-${index}`,
        content,
        author: address || "anonymous",
        createdAt: new Date().toISOString(),
      }))
    );
  };

  const handleSongChange = (songs: string[]) => {
    setSelectedSongs(
      songs.map((songPath) => ({
        title: songPath.split("/").pop() || "Unknown Song",
        path: songPath,
      }))
    );
  };

  // Add a function to handle starting over
  const handleStartOver = useCallback(async () => {
    await clearAllPhotos();
    setPhotos([]);
    setMessages([]);
    setSelectedSongs([]);
    setTitle("A Year in Memories");
    setCustomDates({});
    setCurrentInvites([]);
    setStep("theme"); // Ensure we go back to theme selection
  }, [clearAllPhotos]);

  const renderThemeStep = () => (
    <div className="space-y-6">
      {!isLoadingPhotos && photos.length > 0 && (
        <div className="text-center mb-6">
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-4">
            <p className="text-sm text-blue-800">
              You have {photos.length} photo{photos.length !== 1 ? "s" : ""}{" "}
              saved from a previous session
            </p>
          </div>
          <button
            onClick={handleStartOver}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all saved data and start fresh
          </button>
        </div>
      )}
      <ThemeSelection
        onThemeSelect={(t) => {
          setTheme(t);
          handleNextStep();
        }}
      />
    </div>
  );

  const renderPhotoStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Upload Photos</h2>

      {/* Size indicator */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Total Size: {(totalSize / 1024 / 1024).toFixed(1)}MB
          </span>
          <span
            className={`${sizePercentage > 90 ? "text-red-600" : "text-gray-600"}`}
          >
            Limit: 50MB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              sizePercentage > 90
                ? "bg-red-600"
                : sizePercentage > 75
                  ? "bg-yellow-400"
                  : "bg-blue-600"
            }`}
            style={{ width: `${Math.min(sizePercentage, 100)}%` }}
          />
        </div>
        {sizePercentage > 90 && (
          <p className="text-sm text-red-600 mt-2">
            Warning: Approaching size limit
          </p>
        )}
      </div>

      {isLoadingPhotos ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <PhotoUpload
          photos={photos}
          onPhotosChange={handlePhotosChange}
          customDates={customDates}
          onCustomDatesChange={setCustomDates}
          maxTotalSize={MAX_TOTAL_SIZE}
          currentSize={totalSize}
        />
      )}

      <div className="flex justify-between space-x-4">
        <button
          onClick={handlePreviousStep}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={photos.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case "theme":
        return renderThemeStep();
      case "photos":
        return renderPhotoStep();
      case "messages":
        return (
          <div className="space-y-8">
            <MessageInput
              messages={messages.map((m) => m.content)}
              onMessagesChange={handleMessageChange}
            />
            <TitleInput title={title} onTitleChange={setTitle} />
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "music":
        return (
          <div className="space-y-6">
            <MusicSelection
              selectedSongs={selectedSongs.map((s) => s.path)}
              onSongSelect={handleSongChange}
            />
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "wallet":
        return (
          <WalletConnection
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
          />
        );
      case "collaborators":
        return (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Frens/Famile
              </h3>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-center text-blue-800">
                  Invite valid for 7 days. <br />
                  Once accepted, they&apos;ll have ongoing access to contribute.
                </p>
              </div>

              <CollaboratorInput
                onInviteCreated={(invite) => {
                  setCurrentInvites((prev) => [...prev, invite]);
                }}
              />

              {currentInvites.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Current Invites</h4>
                  <div className="space-y-2">
                    {currentInvites.map((invite, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {invite.displayName || invite.address}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            ({invite.role})
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setCurrentInvites((prev) =>
                              prev
                                .map((inv, idx) =>
                                  idx === i
                                    ? { ...inv, status: "removed" as const }
                                    : inv
                                )
                                .filter((inv) => inv.status !== "removed")
                            )
                          }
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      case "permissions":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <h3 className="text-2xl font-semibold mb-6">
                Set Initial Access
              </h3>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">
                    Your Web3 Capabilities
                  </h4>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Create invites with expiry times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Assign editor or viewer roles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Manage gift permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Transfer ownership if needed</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    In the next step, you&apos;ll be able to add collaborators
                    who can contribute photos to your gift experience.
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      case "preview":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <h2 className="text-2xl font-semibold text-center">
              Your Gift Summary
            </h2>
            <div className="space-y-8">
              {/* Content Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <h3 className="text-lg font-medium mb-6">Your Content</h3>
                <ul className="space-y-4">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {photos.length} photos (
                      {(totalSize / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {messages.length} message{messages.length !== 1 && "s"}
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {selectedSongs.length} song
                      {selectedSongs.length !== 1 && "s"}
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {theme === "space" ? "Space" : "Japanese"} theme
                    </span>
                  </li>
                </ul>
              </div>

              {/* Access Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <h3 className="text-lg font-medium mb-6">Access & Sharing</h3>
                {!isConnected ? (
                  <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-sm text-blue-800 mb-3">
                      Creating without a connected wallet
                    </p>
                    <p className="text-sm text-blue-600">
                      You&apos;ll get a gift ID to share, but won&apos;t be able
                      to edit the gift later.
                      <br />
                      <button
                        onClick={() => setStep("wallet")}
                        className="text-blue-800 underline font-medium mt-2"
                      >
                        Connect wallet for full access
                      </button>
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>You&apos;ll be the gift owner</span>
                    </div>
                    {currentInvites.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-2">Collaborators:</p>
                        {currentInvites.map((invite, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-center gap-2"
                          >
                            <span>{invite.address}</span>
                            <span>•</span>
                            <span className="capitalize">{invite.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handlePreviousStep}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "confirm":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
              <h2 className="text-2xl font-semibold mb-6">Ready to Create</h2>

              <div className="space-y-6">
                {!isConnected && (
                  <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto mb-6">
                    <p className="text-sm text-blue-600">
                      You&apos;recreating without a wallet. You&apos;ll get a
                      gift ID to share, but won&apos;t be able to make changes
                      later.
                      <br />
                      <button
                        onClick={() => setStep("wallet")}
                        className="text-blue-800 underline font-medium mt-2"
                      >
                        Want to connect a wallet?
                      </button>
                    </p>
                  </div>
                )}

                <div className="max-w-sm mx-auto">
                  {isConnected ? (
                    <>
                      <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                        <h4 className="font-medium mb-2 text-blue-900">
                          Contract Interactions
                        </h4>
                        <p className="text-sm text-blue-800 mb-3">
                          You&apos;ll need to sign two transactions on Lens
                          Sepolia testnet:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                          <li>Set you as the gift owner (small gas fee)</li>
                          <li>
                            Send {currentInvites.length} invite
                            {currentInvites.length !== 1 ? "s" : ""} to
                            collaborators (small gas fee)
                          </li>
                        </ol>
                        <p className="text-xs text-blue-700 mt-3">
                          Gas fees are paid in $GRASS on Lens Sepolia testnet
                        </p>
                      </div>
                      <p className="text-gray-600 mb-4">
                        After signing, we&apos;ll:
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600 mb-6">
                      Here&apos;s what happens next:
                    </p>
                  )}

                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your content is securely stored</span>
                    </li>
                    {isConnected ? (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>You&apos;ll be set as the owner</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>7-day invites sent to collaborators</span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>You get a gift ID to share</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 max-w-sm mx-auto mt-8">
                  <button
                    onClick={handleComplete}
                    disabled={uploadStatus.isUploading}
                    className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadStatus.isUploading ? "Creating..." : "Create Gift"}
                  </button>
                  <button
                    onClick={handlePreviousStep}
                    disabled={uploadStatus.isUploading}
                    className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  {isConnected && (
                    <p className="text-sm text-gray-500">
                      You can edit or delete your gift anytime
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <GiftFlowLayout currentStep={step} steps={STEPS} onClose={onClose}>
      {renderStepContent()}

      {(uploadStatus.isUploading || uploadStatus.status === "ready") && (
        <UploadStatusOverlay
          status={uploadStatus}
          theme={theme}
          onDownload={() => handleDownload(uploadStatus.giftId!, theme)}
          onClose={onClose}
          onCopyId={() =>
            uploadStatus.giftId && copyToClipboard(uploadStatus.giftId)
          }
        >
          {isConnected &&
            uploadStatus.status === "ready" &&
            !txStatus.isConfirmed && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Ready for your signature</h4>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-blue-800">
                    Please sign two quick transactions:
                  </p>
                  <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span>Set you as gift owner</span>
                      {txStatus.isConfirming && (
                        <span className="text-xs text-blue-600">
                          Confirming...
                        </span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>
                        Send {currentInvites.length} invite
                        {currentInvites.length !== 1 ? "s" : ""}
                      </span>
                    </li>
                  </ol>
                  <p className="text-xs text-blue-700">
                    Each transaction needs a small amount of $GRASS for gas
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {txStatus.isConfirming
                    ? "Confirming..."
                    : "Sign Transactions"}
                </button>
              </div>
            )}
        </UploadStatusOverlay>
      )}
    </GiftFlowLayout>
  );
}
