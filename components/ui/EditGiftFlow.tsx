import React, { useState, useEffect, useCallback } from "react";
import { Tab } from "@headlessui/react";
import {
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { EditPhotoUpload } from "@components/shared/EditPhotoUpload";
import { MessageInput } from "@components/shared/MessageInput";
import { MusicSelection } from "@components/shared/MusicSelection";
import { BaseModal } from "@components/shared/base/BaseModal";
import { useGiftPhotos } from "@hooks/useGiftPhotos";
import { useGiftEditor } from "@hooks/useGiftEditor";
import { Photo, UploadStatus } from "@utils/types/gift";
import { CollaborativeGift } from "@utils/types/collaborative";
import { UploadStatusOverlay } from "@components/shared/UploadStatusOverlay";

interface EditGiftFlowProps {
  gift: CollaborativeGift;
  userRole: "owner" | "editor" | null;
  onSave: (updates: Partial<CollaborativeGift>) => Promise<void>;
  onClose: () => Promise<void | boolean>;
}

interface ChangesSummary {
  photos: {
    added: number;
    modified: number;
    deleted: number;
  };
  messages: boolean;
  music: boolean;
}

export function EditGiftFlow({
  gift,
  userRole,
  onSave,
  onClose,
}: EditGiftFlowProps): React.ReactElement {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangesSummary, setShowChangesSummary] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    status: "idle",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changesSummary, setChangesSummary] = useState<ChangesSummary>({
    photos: { added: 0, modified: 0, deleted: 0 },
    messages: false,
    music: false,
  });

  // Store original state for discarding changes
  const [originalState, setOriginalState] = useState({
    photos: [] as Photo[],
    messages: [] as string[],
    music: [] as string[],
  });

  const {
    photos,
    loadedPhotos,
    skippedPhotos,
    loadingState,
    setPhotos,
    loadNextBatch,
    updatePhoto,
  } = useGiftPhotos();
  const { messages, setMessages, music, setMusic, deleteGift } =
    useGiftEditor();

  // Initialize state from gift data
  useEffect(() => {
    // Try to load draft first
    try {
      const savedDraft = localStorage.getItem(`gift-${gift.giftId}-draft`);
      if (savedDraft) {
        const { photos: draftPhotos, lastModified } = JSON.parse(savedDraft);
        const draftDate = new Date(lastModified);
        const giftDate = new Date(gift.lastModified);

        // Only use draft if it's newer than the gift's last modification
        if (draftDate > giftDate) {
          console.log("Restoring draft from:", lastModified);
          setPhotos(draftPhotos);
          setHasUnsavedChanges(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to load draft:", error);
    }

    // If no draft or draft is older, use gift data
    const convertedPhotos: Photo[] = (gift.photos || []).map((photo) => ({
      file: new File([], photo.name), // Placeholder file
      preview: photo.url,
      dateTaken: photo.dateTaken,
      ipfsHash: photo.ipfsHash,
      isExisting: true,
      isNew: false,
      isDateModified: false,
      isDeleted: false,
      originalDate: photo.dateTaken, // Store original date for comparison
    }));
    setPhotos(convertedPhotos);
    setMessages(gift.messages || []);
    setMusic(gift.music || []);

    // Store original state for discarding changes
    setOriginalState({
      photos: convertedPhotos,
      messages: gift.messages || [],
      music: gift.music || [],
    });
  }, [gift, setPhotos, setMessages, setMusic]);

  // Handle photo changes with proper state flags
  const handlePhotoChange = useCallback(
    (newPhotos: Photo[]) => {
      // Find which photo was changed by comparing with current state
      const changedPhotoIndex = newPhotos.findIndex((photo, index) => {
        const currentPhoto = loadedPhotos[index];
        if (!currentPhoto) return false;
        return (
          photo.dateTaken !== currentPhoto.dateTaken ||
          photo.isDeleted !== currentPhoto.isDeleted
        );
      });

      if (changedPhotoIndex !== -1) {
        const changedPhoto = newPhotos[changedPhotoIndex];
        const originalPhoto = originalState.photos.find(
          (p) =>
            p.ipfsHash === changedPhoto.ipfsHash ||
            p.file.name === changedPhoto.file.name
        );

        if (originalPhoto) {
          const isDateModified =
            changedPhoto.dateTaken !==
            (originalPhoto.originalDate || originalPhoto.dateTaken);

          // Create updated photo with proper flags
          const updatedPhoto = {
            ...changedPhoto,
            isDateModified,
            originalDate: originalPhoto.originalDate || originalPhoto.dateTaken,
            isDeleted: changedPhoto.isDeleted ?? originalPhoto.isDeleted,
          };

          // Debug state changes
          console.log("Photo state change:", {
            name: updatedPhoto.file.name,
            isDateModified,
            originalDate: originalPhoto.originalDate || originalPhoto.dateTaken,
            newDate: updatedPhoto.dateTaken,
            isDeleted: updatedPhoto.isDeleted,
          });

          // Update the specific photo
          updatePhoto(changedPhotoIndex, updatedPhoto);
          setHasUnsavedChanges(true);

          // Store the updated state in localStorage for recovery
          try {
            localStorage.setItem(
              `gift-${gift.giftId}-draft`,
              JSON.stringify({
                photos: newPhotos,
                lastModified: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.warn("Failed to save draft:", error);
          }
        }
      } else {
        // If we can't find which photo changed, fall back to updating all photos
        setPhotos(newPhotos);
      }
    },
    [loadedPhotos, originalState.photos, updatePhoto, setPhotos, gift.giftId]
  );

  // Handle discarding changes
  const handleDiscardChanges = useCallback(() => {
    setPhotos(originalState.photos);
    setMessages(originalState.messages);
    setMusic(originalState.music);
    setHasUnsavedChanges(false);
    setIsPreviewMode(false);
  }, [originalState, setPhotos, setMessages, setMusic]);

  // Track changes and update summary
  useEffect(() => {
    const newChangesSummary: ChangesSummary = {
      photos: {
        added: loadedPhotos.filter((p) => p.isNew).length,
        modified: loadedPhotos.filter((p) => p.isDateModified).length,
        deleted: loadedPhotos.filter((p) => p.isDeleted).length,
      },
      messages:
        JSON.stringify(messages) !== JSON.stringify(originalState.messages),
      music: JSON.stringify(music) !== JSON.stringify(originalState.music),
    };

    setChangesSummary(newChangesSummary);
    setHasUnsavedChanges(
      newChangesSummary.photos.added > 0 ||
        newChangesSummary.photos.modified > 0 ||
        newChangesSummary.photos.deleted > 0 ||
        newChangesSummary.messages ||
        newChangesSummary.music
    );
  }, [loadedPhotos, messages, music, originalState]);

  // Handle saving changes
  const handleSave = async () => {
    // First, enter preview mode to review changes
    setIsPreviewMode(true);
  };

  // Handle confirming changes and saving to IPFS
  const handleConfirmChanges = async () => {
    try {
      setUploadStatus({
        isUploading: true,
        status: "uploading",
        message: "Uploading modified photos to IPFS...",
        uploadedFiles: 0,
        totalFiles: loadedPhotos.filter((p) => p.isNew || p.isDateModified)
          .length,
      });

      // First upload any new or modified photos
      const updatedPhotos = await Promise.all(
        loadedPhotos
          .filter((p) => !p.isDeleted)
          .map(async (photo, index) => {
            // If photo is new or modified, upload it
            if (photo.isNew || photo.isDateModified) {
              const formData = new FormData();
              formData.append("file", photo.file);
              formData.append(
                "metadata",
                JSON.stringify({
                  name: photo.file.name,
                  keyvalues: {
                    type: "photo",
                    giftId: gift.giftId,
                    dateTaken: photo.dateTaken,
                  },
                })
              );

              const response = await fetch("/api/pinata/upload", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                throw new Error(
                  `Failed to upload photo: ${response.statusText}`
                );
              }

              const { ipfsHash } = await response.json();

              // Update progress
              setUploadStatus((prev) => ({
                ...prev,
                uploadedFiles: (prev.uploadedFiles || 0) + 1,
                message: `Uploading photos to IPFS (${index + 1}/${loadedPhotos.length})...`,
              }));

              return {
                id: ipfsHash,
                name: photo.file.name,
                url: photo.preview,
                ipfsHash,
                dateTaken: photo.dateTaken,
                description: `Photo taken on ${new Date(photo.dateTaken).toLocaleDateString()}`,
                width: 1280, // Default width
                height: 720, // Default height
              };
            }

            // If photo is unchanged, return existing data
            return {
              id: photo.ipfsHash,
              name: photo.file.name,
              url: photo.preview,
              ipfsHash: photo.ipfsHash,
              dateTaken: photo.dateTaken,
              description: `Photo taken on ${new Date(photo.dateTaken).toLocaleDateString()}`,
              width: 1280,
              height: 720,
            };
          })
      );

      setUploadStatus((prev) => ({
        ...prev,
        status: "verifying",
        message: "Creating updated gift metadata...",
      }));

      // Create updated metadata
      const updatedMetadata = {
        ...gift,
        photos: updatedPhotos,
        messages,
        music,
        lastModified: new Date().toISOString(),
        version: gift.version + 1,
      };

      // Upload metadata to IPFS
      const metadataResponse = await fetch("/api/pinata/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedMetadata,
          pinataMetadata: {
            name: `Gift ${gift.giftId} Metadata`,
            keyvalues: {
              giftId: gift.giftId,
              type: "metadata",
              owner: gift.owner,
              version: updatedMetadata.version.toString(),
            },
          },
        }),
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(
          `Failed to upload gift metadata: ${error.message || error.error || "Unknown error"}`
        );
      }

      const { ipfsHash: metadataHash } = await metadataResponse.json();

      // Clear draft from local storage
      localStorage.removeItem(`gift-${gift.giftId}-draft`);

      setUploadStatus({
        isUploading: false,
        status: "ready",
        message: "Changes saved successfully!",
        giftId: gift.giftId,
        ipfsHash: metadataHash,
      });

      // Update original state with new values
      setOriginalState({
        photos: loadedPhotos,
        messages,
        music,
      });

      setHasUnsavedChanges(false);
      setIsPreviewMode(false);

      // Call onSave with the updated data
      await onSave(updatedMetadata);
    } catch (error) {
      console.error("Error saving changes:", error);
      setUploadStatus({
        isUploading: false,
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save changes. Please try again.",
      });
    }
  };

  // Start loading photos when they are set
  useEffect(() => {
    if (photos.length > 0 && loadingState === "idle") {
      loadNextBatch();
    }
  }, [photos, loadingState, loadNextBatch]);

  const handleDeleteGift = async () => {
    try {
      setUploadStatus({
        isUploading: true,
        status: "uploading",
        message: "Deleting gift...",
      });
      await deleteGift();
      setUploadStatus({
        isUploading: false,
        status: "ready",
        message: "Gift deleted successfully",
      });
      setShowDeleteModal(false);
      await onClose();
    } catch (error) {
      console.error("Error deleting gift:", error);
      setUploadStatus({
        isUploading: false,
        status: "error",
        message: "Failed to delete gift. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Edit Gift</h2>
        <div className="flex gap-4">
          {hasUnsavedChanges && (
            <button
              onClick={() => setShowChangesSummary(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
            >
              <ExclamationCircleIcon className="h-5 w-5" />
              View Changes
            </button>
          )}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <SparklesIcon className="h-5 w-5" />
            {isPreviewMode ? "Exit Preview" : "Preview"}
          </button>
          {userRole === "owner" && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
            >
              <XMarkIcon className="h-5 w-5" />
              Delete Gift
            </button>
          )}
        </div>
      </div>

      {/* Changes Summary Modal */}
      <BaseModal
        isOpen={showChangesSummary}
        onClose={() => setShowChangesSummary(false)}
        title="Pending Changes"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Photos</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {changesSummary.photos.added > 0 && (
                <li className="text-green-600">
                  • {changesSummary.photos.added} new photo(s) added
                </li>
              )}
              {changesSummary.photos.modified > 0 && (
                <li className="text-yellow-600">
                  • {changesSummary.photos.modified} photo date(s) modified
                </li>
              )}
              {changesSummary.photos.deleted > 0 && (
                <li className="text-red-600">
                  • {changesSummary.photos.deleted} photo(s) marked for deletion
                </li>
              )}
            </ul>
          </div>
          {changesSummary.messages && (
            <div>
              <h4 className="font-medium">Messages</h4>
              <p className="text-sm text-gray-600">• Message text updated</p>
            </div>
          )}
          {changesSummary.music && (
            <div>
              <h4 className="font-medium">Music</h4>
              <p className="text-sm text-gray-600">• Music selection changed</p>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <p>
              These changes will be saved to IPFS when you click the &ldquo;Save
              Changes&rdquo; button.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowChangesSummary(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Delete confirmation modal */}
      <BaseModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Gift"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this gift? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGift}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Gift
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? "bg-white text-gray-700 shadow"
                  : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-600"
              }`
            }
          >
            Photos
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? "bg-white text-gray-700 shadow"
                  : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-600"
              }`
            }
          >
            Message
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? "bg-white text-gray-700 shadow"
                  : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-600"
              }`
            }
          >
            Music
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="space-y-4">
              {skippedPhotos.length > 0 && (
                <div className="p-4 rounded-lg bg-yellow-50 text-yellow-700">
                  <p>
                    {skippedPhotos.length} photo(s) were skipped due to size
                    limitations. Please compress these photos and try again.
                  </p>
                </div>
              )}
              <EditPhotoUpload
                photos={loadedPhotos}
                onPhotosChange={handlePhotoChange}
                isPreviewMode={isPreviewMode}
                key={`photo-upload-${loadedPhotos.length}-${loadedPhotos.filter((p) => p.isDateModified).length}`}
              />
              {loadingState === "loading" && (
                <div className="text-center text-gray-500">
                  Loading photos...
                </div>
              )}
              {loadingState === "error" && (
                <div className="text-center text-red-500">
                  Error loading photos. Please try again.
                </div>
              )}
              {loadingState === "more-available" && (
                <button
                  onClick={loadNextBatch}
                  className="w-full py-2 text-blue-600 hover:text-blue-700"
                >
                  Load more photos
                </button>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <MessageInput
              messages={messages}
              onMessagesChange={setMessages}
              maxMessages={5}
              defaultMessages={gift.messages}
              isPreviewMode={isPreviewMode}
            />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <MusicSelection
              selectedSongs={music}
              onSongSelect={setMusic}
              isPreviewMode={isPreviewMode}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Save/Discard Changes */}
      {hasUnsavedChanges && !isPreviewMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-4">
          <button
            onClick={handleDiscardChanges}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Preview Changes
          </button>
        </div>
      )}

      {/* Confirm Changes in Preview Mode */}
      {isPreviewMode && hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-4">
          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Continue Editing
          </button>
          <button
            onClick={handleConfirmChanges}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Confirm & Save to IPFS
          </button>
        </div>
      )}

      {/* Upload Status Overlay */}
      {uploadStatus.status !== "idle" && (
        <UploadStatusOverlay
          status={uploadStatus}
          theme="space"
          onDownload={() => {}}
          onCopyId={() => {}}
          onClose={() =>
            setUploadStatus({ isUploading: false, status: "idle" })
          }
        />
      )}
    </div>
  );
}
