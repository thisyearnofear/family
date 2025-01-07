import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  PhotoIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import type { ImageProps } from "../../utils/types/types";
import type {
  CollaborativeGift,
  Editor,
  PendingInvite,
} from "../../utils/types/collaborative";
import MonthlyCollage from "./MonthlyCollage";
import { useTheme } from "../../contexts/ThemeContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { SONGS } from "../../utils/constants";
import { useLensProfile } from "../../hooks/useLensProfile";
import { debounce } from "lodash";

interface Photo {
  file: File;
  preview: string;
  dateTaken: string;
}

interface UpdateStatus {
  isUpdating: boolean;
  error: string | null;
  progress: number;
  status: "updating" | "verifying" | "ready" | "error";
}

type EditTab = "photos" | "messages" | "music" | "collaborators" | "preview";

interface EditGiftFlowProps {
  gift: CollaborativeGift;
  userRole: "owner" | "editor";
  onSave: (updates: Partial<CollaborativeGift>) => Promise<void>;
  onClose: () => void;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton = ({ isActive, onClick, icon, label }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
      isActive
        ? "bg-gray-800 text-white"
        : "bg-white/50 text-gray-600 hover:bg-white/80"
    }`}
  >
    {icon}
    <span className="ml-2 text-sm-mobile sm:text-base">{label}</span>
  </button>
);

export default function EditGiftFlow({
  gift,
  userRole,
  onSave,
  onClose,
}: EditGiftFlowProps) {
  const [activeTab, setActiveTab] = useState<EditTab>("photos");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<string[]>(gift.messages);
  const [title, setTitle] = useState<string>(gift.title || "");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isUpdating: false,
    error: null,
    progress: 0,
    status: "ready",
  });

  const { theme } = useTheme();
  const { isPlaying, currentPlayingSong, togglePlaySong } = useAudioPlayer();
  const {
    searchProfile,
    profile,
    isLoading: isSearching,
    error: searchError,
  } = useLensProfile();
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchProfile(query);
    }, 500),
    [searchProfile]
  );

  // Photo upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Get date taken from EXIF data or use current date
        const dateTaken = new Date().toISOString();
        setPhotos((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            dateTaken,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
  });

  // Save changes
  const handleSave = async () => {
    setUpdateStatus((prev) => ({
      ...prev,
      isUpdating: true,
      status: "updating",
    }));

    try {
      // Prepare updates
      const updates: Partial<CollaborativeGift> = {
        messages,
        title,
        version: gift.version + 1,
        lastModified: new Date().toISOString(),
      };

      // Send updates to API
      const response = await fetch(`/api/gifts/${gift.giftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "wallet-address": gift.owner, // TODO: Get from connected wallet
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save changes");
      }

      const updatedGift = await response.json();
      onSave(updatedGift);

      setUpdateStatus((prev) => ({
        ...prev,
        isUpdating: false,
        status: "ready",
      }));
    } catch (error) {
      console.error("Error saving changes:", error);
      setUpdateStatus((prev) => ({
        ...prev,
        isUpdating: false,
        error:
          error instanceof Error ? error.message : "Failed to save changes",
        status: "error",
      }));
    }
  };

  const renderTabs = () => (
    <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
      <TabButton
        isActive={activeTab === "photos"}
        onClick={() => setActiveTab("photos")}
        icon={<PhotoIcon className="w-5 h-5" />}
        label="Photos"
      />
      <TabButton
        isActive={activeTab === "messages"}
        onClick={() => setActiveTab("messages")}
        icon={<PencilSquareIcon className="w-5 h-5" />}
        label="Messages"
      />
      <TabButton
        isActive={activeTab === "music"}
        onClick={() => setActiveTab("music")}
        icon={<PhotoIcon className="w-5 h-5" />}
        label="Music"
      />
      {userRole === "owner" && (
        <TabButton
          isActive={activeTab === "collaborators"}
          onClick={() => setActiveTab("collaborators")}
          icon={<UserGroupIcon className="w-5 h-5" />}
          label="Collaborators"
        />
      )}
      <TabButton
        isActive={activeTab === "preview"}
        onClick={() => setActiveTab("preview")}
        icon={<PhotoIcon className="w-5 h-5" />}
        label="Preview"
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "photos":
        return (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors touch-feedback ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-sm-mobile sm:text-base">
                Tap to add photos, or drag & drop
              </p>
            </div>

            {/* Existing photos */}
            <div className="mobile-grid">
              {gift.photos.map((photo) => (
                <div key={photo.id} className="timeline-card">
                  <Image
                    src={photo.url}
                    alt={photo.description || ""}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* New photos */}
            {photos.length > 0 && (
              <div className="mobile-grid mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="timeline-card">
                    <Image
                      src={photo.preview}
                      alt={`New photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white touch-feedback"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "messages":
        return (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessages((prev) =>
                      prev.map((m, i) => (i === index ? e.target.value : m))
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  rows={3}
                />
                <button
                  onClick={() =>
                    setMessages((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="p-2 text-gray-400 hover:text-gray-600 touch-feedback"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setMessages((prev) => [...prev, ""])}
              className="w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 touch-feedback"
            >
              Add Message
            </button>
          </div>
        );

      case "music":
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold">Select Music (Max 2)</h3>
            <p className="text-sm text-gray-600 mb-6">
              by{" "}
              <a
                href="https://open.spotify.com/artist/3yhUYybUxwJn1or7zHXWHy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                PAPA
              </a>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SONGS.map((song) => {
                const isSelected = gift.music?.includes(song.path);
                return (
                  <div
                    key={song.path}
                    className={`p-4 rounded-lg border ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    } hover:border-blue-300 transition-colors cursor-pointer`}
                    onClick={() => {
                      const currentMusic = gift.music || [];
                      const newMusic = isSelected
                        ? currentMusic.filter((s) => s !== song.path)
                        : [...currentMusic, song.path].slice(0, 2);
                      onSave({ ...gift, music: newMusic });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{song.title}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlaySong(song.path);
                          }}
                          className="p-2 rounded-full hover:bg-gray-100 touch-feedback"
                        >
                          {currentPlayingSong === song.path && isPlaying ? (
                            <PauseIcon className="w-5 h-5" />
                          ) : (
                            <PlayIcon className="w-5 h-5" />
                          )}
                        </button>
                        {isSelected && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {gift.music && gift.music.length > 0 && (
              <p className="text-sm text-gray-600">
                Selected: {gift.music.length}/2 songs
              </p>
            )}
          </div>
        );

      case "collaborators":
        return (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">
                Current Collaborators
              </h3>

              {/* Current collaborators list */}
              <div className="space-y-4 mb-8">
                {gift.editors?.map((editor: Editor) => (
                  <div
                    key={editor.address}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {editor.avatar && (
                        <img
                          src={editor.avatar}
                          alt={editor.displayName || editor.address}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {editor.displayName ||
                            `${editor.address.slice(
                              0,
                              6
                            )}...${editor.address.slice(-4)}`}
                        </p>
                        {editor.handle && (
                          <p className="text-sm text-gray-500">
                            @{editor.handle}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updatedGift = {
                          ...gift,
                          editors: gift.editors?.filter(
                            (e) => e.address !== editor.address
                          ),
                          version: gift.version + 1,
                          lastModified: new Date().toISOString(),
                        };
                        onSave(updatedGift);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Invite new collaborator */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Invite Collaborator</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter Lens handle or address"
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {isSearching && (
                    <div className="text-sm text-gray-500">Searching...</div>
                  )}

                  {searchError && (
                    <div className="text-sm text-red-500">{searchError}</div>
                  )}

                  {profile && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        {profile.avatar && (
                          <img
                            src={profile.avatar}
                            alt={profile.displayName}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{profile.displayName}</p>
                          <p className="text-sm text-gray-500">
                            @{profile.handle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <select
                          value={inviteRole}
                          onChange={(e) =>
                            setInviteRole(e.target.value as "editor" | "viewer")
                          }
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={handleInvite}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Send Invite
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pending invites */}
                {gift.pendingInvites && gift.pendingInvites.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Pending Invites
                    </h3>
                    <div className="space-y-4">
                      {gift.pendingInvites.map((invite) => (
                        <div
                          key={invite.inviteeAddress}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {invite.avatar && (
                              <img
                                src={invite.avatar}
                                alt={
                                  invite.displayName || invite.inviteeAddress
                                }
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {invite.displayName ||
                                  `${invite.inviteeAddress.slice(
                                    0,
                                    6
                                  )}...${invite.inviteeAddress.slice(-4)}`}
                              </p>
                              {invite.handle && (
                                <p className="text-sm text-gray-500">
                                  @{invite.handle}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                Invited as {invite.role} •{" "}
                                {new Date(
                                  invite.invitedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updatedGift = {
                                ...gift,
                                pendingInvites: gift.pendingInvites?.filter(
                                  (i) =>
                                    i.inviteeAddress !== invite.inviteeAddress
                                ),
                                version: gift.version + 1,
                                lastModified: new Date().toISOString(),
                              };
                              onSave(updatedGift);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "preview":
      // ... preview case ...

      default:
        return null;
    }
  };

  const handleInvite = async () => {
    if (!profile) return;

    const newInvite: PendingInvite = {
      inviteeAddress: profile.address,
      role: inviteRole,
      handle: profile.handle,
      displayName: profile.displayName,
      avatar: profile.avatar || undefined,
      invitedAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      // Update the gift with the new invite
      const updatedGift = {
        ...gift,
        pendingInvites: [...(gift.pendingInvites || []), newInvite],
        version: gift.version + 1,
        lastModified: new Date().toISOString(),
      };

      await onSave(updatedGift);
    } catch (error) {
      console.error("Error sending invite:", error);
      setUpdateStatus((prev) => ({
        ...prev,
        error: "Failed to send invite",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 p-2 xs:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h1 className="text-xl sm:text-2xl font-['Lora'] text-gray-800/90">
              Editing: {title || gift.giftId}
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleSave}
                disabled={updateStatus.isUpdating}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 touch-feedback"
              >
                {updateStatus.isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors touch-feedback"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 pb-2">{renderTabs()}</div>
          {renderTabContent()}

          {updateStatus.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm-mobile sm:text-base">
              {updateStatus.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
