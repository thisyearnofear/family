import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import {
  PhotoIcon,
  PencilSquareIcon,
  UserGroupIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { CollaborativeGift } from "@utils/types/collaborative";
import type { Photo } from "@utils/types/gift";

interface StagedChanges {
  photos?: Photo[];
  messages?: string[];
  music?: string[];
}

// Lazy load heavy components with proper types
const PhotoUpload = lazy(() =>
  import("@components/shared/PhotoUpload").then((mod) => ({
    default: mod.PhotoUpload,
  }))
);
const MessageInput = lazy(() =>
  import("@components/shared/MessageInput").then((mod) => ({
    default: mod.MessageInput,
  }))
);
const MusicSelection = lazy(() =>
  import("@components/shared/MusicSelection").then((mod) => ({
    default: mod.MusicSelection,
  }))
);
const PermissionsDashboard = lazy(() =>
  import("@components/shared/PermissionsDashboard").then((mod) => ({
    default: mod.PermissionsDashboard,
  }))
);
const WalletEducation = lazy(() => import("./WalletEducation"));

// Loading fallback component
const LoadingFallback = (): React.ReactElement => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="space-y-2 text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

interface EditGiftFlowProps {
  gift: CollaborativeGift;
  userRole?: "owner" | "editor";
  onSave: (updates: Partial<CollaborativeGift>) => Promise<void>;
  onClose: () => void;
}

export default function EditGiftFlow({
  gift,
  userRole,
  onSave,
  onClose,
}: EditGiftFlowProps): React.ReactElement {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [showEducation, setShowEducation] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "messages" | "music" | "photos" | "preview"
  >("messages");
  const [showPermissions, setShowPermissions] = useState(true);

  // Track staged changes
  const [stagedChanges, setStagedChanges] = useState<StagedChanges>({});

  // Initialize staged changes with current gift data
  useEffect(() => {
    setStagedChanges({
      photos:
        gift.photos?.map(
          (photo) =>
            ({
              file: new File([], photo.name),
              preview: `/api/pinata/image?cid=${photo.ipfsHash}`,
              dateTaken: photo.dateTaken,
              originalDate: photo.dateTaken,
              isExisting: true,
              isNew: false,
              isDateModified: false,
              ipfsHash: photo.ipfsHash,
            }) as Photo
        ) || [],
      messages: gift.messages || [],
      music: gift.music || [],
    });

    // Start preloading images immediately when gift data is available
    if (gift.photos?.length) {
      const preloadImages = async () => {
        const imageCache = new Map();
        const batchSize = 3;
        const photos = gift.photos || [];

        for (let i = 0; i < photos.length; i += batchSize) {
          const batch = photos.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (photo) => {
              const url = `/api/pinata/image?cid=${photo.ipfsHash}`;
              if (!imageCache.has(url)) {
                try {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  imageCache.set(url, objectUrl);
                } catch (error) {
                  console.error("Error preloading image:", error);
                }
              }
            })
          );
        }
      };

      preloadImages();
    }
  }, [gift]);

  // Compare arrays for changes
  const hasArrayChanges = useCallback(
    (key: keyof StagedChanges): boolean => {
      const stagedArray = stagedChanges[key];
      const giftArray = gift[key as keyof CollaborativeGift];

      if (!Array.isArray(stagedArray) || !Array.isArray(giftArray)) {
        return false;
      }

      if (stagedArray.length !== giftArray.length) {
        return true;
      }

      if (key === "photos") {
        return (stagedArray as Photo[]).some(
          (photo) => photo.isNew || photo.isDateModified
        );
      }

      return false;
    },
    [stagedChanges, gift]
  );

  // Handle saving all changes
  const handleSaveChanges = async () => {
    if (!stagedChanges.photos) return;

    // Convert staged photos to the gift format
    const updatedPhotos = stagedChanges.photos.map((photo, index) => ({
      id: String(index + 1),
      name: photo.file.name,
      description: `Photo taken on ${new Date(photo.dateTaken).toLocaleDateString()}`,
      ipfsHash: photo.preview.startsWith("/api/pinata/image?cid=")
        ? photo.preview.split("=")[1]
        : "",
      dateTaken: photo.dateTaken,
      url: photo.preview,
      width: 1280,
      height: 720,
    }));

    await onSave({
      ...gift,
      photos: updatedPhotos,
      messages: stagedChanges.messages,
      music: stagedChanges.music,
    });
  };

  // If not connected, show wallet education or simplified dashboard
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          {showEducation ? (
            <Suspense fallback={<LoadingFallback />}>
              <WalletEducation onBack={() => setShowEducation(false)} />
            </Suspense>
          ) : (
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl sm:text-2xl font-['Lora'] text-gray-800/90">
                    Connect Wallet
                  </h1>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      Connect Wallet to Edit
                    </h3>
                    <p className="text-blue-700 mb-4">
                      To edit this gift, you&apos;ll need to connect your wallet
                      and verify ownership.
                    </p>
                    <ConnectKitButton.Custom>
                      {({ show }) => (
                        <button
                          onClick={show}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </ConnectKitButton.Custom>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!showEducation && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowEducation(true)}
              className="mt-4 w-full text-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              Learn more about wallets →
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // If showing permissions dashboard
  if (showPermissions) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Start preloading images while on permissions screen */}
          {gift.photos?.map((photo) => (
            <link
              key={photo.ipfsHash}
              rel="preload"
              as="image"
              href={`/api/pinata/image?cid=${photo.ipfsHash}`}
            />
          ))}
          <Suspense fallback={<LoadingFallback />}>
            <PermissionsDashboard
              gift={gift}
              userRole={userRole}
              onBack={onClose}
              onNext={() => setShowPermissions(false)}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // If connected but no permissions, show no access state
  if (isConnected && !userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Edit Access</h2>
              <p className="text-gray-600 mb-6">
                You don&apos;t have permission to edit this gift. Only the owner
                and invited editors can make changes.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </button>
              <p className="text-sm text-gray-500">
                Want to create your own gift? You can start fresh from the home
                page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main editing interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl sm:text-2xl font-['Lora'] text-gray-800/90">
              Edit Gift
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPermissions(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <UserGroupIcon className="w-5 h-5" />
                <span className="text-sm">Manage Access</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "messages" as const,
                  name: "Messages",
                  icon: PencilSquareIcon,
                },
                { id: "music" as const, name: "Music", icon: UserGroupIcon },
                { id: "photos" as const, name: "Photos", icon: PhotoIcon },
                {
                  id: "preview" as const,
                  name: "Preview",
                  icon: UserGroupIcon,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const hasChanges =
                  tab.id === "preview" ? false : hasArrayChanges(tab.id);

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } flex items-center px-1 py-4 border-b-2 font-medium text-sm relative`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                    {hasChanges && (
                      <span className="absolute top-2 right-0 h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "photos" && (
              <Suspense fallback={<LoadingFallback />}>
                <PhotoUpload
                  photos={stagedChanges.photos || []}
                  onPhotosChange={(photos: Photo[]) => {
                    setStagedChanges((prev: StagedChanges) => ({
                      ...prev,
                      photos: [
                        ...(prev.photos?.filter((p: Photo) => p.isExisting) ||
                          []),
                        ...photos
                          .filter((p: Photo) => !p.isExisting)
                          .map((p: Photo) => ({
                            ...p,
                            isNew: true,
                          })),
                      ],
                    }));
                  }}
                  customDates={Object.fromEntries(
                    (stagedChanges.photos || []).map((photo: Photo) => [
                      photo.file.name,
                      photo.dateTaken,
                    ])
                  )}
                  onCustomDatesChange={(dates: { [key: string]: string }) => {
                    setStagedChanges((prev: StagedChanges) => ({
                      ...prev,
                      photos: prev.photos?.map((photo: Photo) => ({
                        ...photo,
                        dateTaken: dates[photo.file.name] || photo.dateTaken,
                        isDateModified:
                          dates[photo.file.name] !== photo.originalDate,
                      })),
                    }));
                  }}
                />
              </Suspense>
            )}
            {activeTab === "messages" && (
              <Suspense fallback={<LoadingFallback />}>
                <MessageInput
                  messages={stagedChanges.messages || []}
                  onMessagesChange={(newMessages: string[]) => {
                    setStagedChanges((prev) => ({
                      ...prev,
                      messages: newMessages,
                    }));
                  }}
                />
              </Suspense>
            )}
            {activeTab === "music" && (
              <Suspense fallback={<LoadingFallback />}>
                <MusicSelection
                  selectedSongs={stagedChanges.music || []}
                  onSongSelect={(newSongs: string[]) => {
                    setStagedChanges((prev) => ({ ...prev, music: newSongs }));
                  }}
                />
              </Suspense>
            )}
            {activeTab === "preview" && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Review Changes
                  </h3>
                  <div className="space-y-4">
                    {hasArrayChanges("photos") && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span>
                          {stagedChanges.photos?.length || 0} photos (
                          {stagedChanges.photos?.filter((p) => p.isNew)
                            .length || 0}{" "}
                          new,{" "}
                          {stagedChanges.photos?.filter((p) => p.isDateModified)
                            .length || 0}{" "}
                          dates modified)
                        </span>
                      </div>
                    )}
                    {stagedChanges.messages?.length !==
                      gift.messages?.length && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span>
                          {stagedChanges.messages?.length || 0} messages
                        </span>
                      </div>
                    )}
                    {stagedChanges.music?.length !== gift.music?.length && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span>{stagedChanges.music?.length || 0} songs</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setStagedChanges({})}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
