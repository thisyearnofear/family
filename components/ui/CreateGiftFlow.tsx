import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  SparklesIcon,
  PhotoIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  CalendarIcon,
  PauseIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { uploadPhotos } from "@utils/api/pinata";
import type { ImageProps, UploadResult } from "@utils/types/types";

interface PhotoUpload {
  file: File;
  preview: string;
  dateTaken?: string;
  monthAssigned?: string;
  uploadStatus?: "pending" | "uploading" | "complete" | "error";
  ipfsHash?: string;
}

interface MonthGroup {
  month: string;
  photos: PhotoUpload[];
}

interface CreateGiftFlowProps {
  onClose: () => void;
  onComplete: (data: {
    theme: "space" | "japanese";
    messages: string[];
    photos: ImageProps[];
    giftId: string;
  }) => void;
}

const MAX_PHOTOS_PER_MONTH = 3;

const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
];

const CreateGiftFlow: React.FC<CreateGiftFlowProps> = ({
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<"space" | "japanese">();
  const [messages, setMessages] = useState<string[]>([
    "Family is constant — gravity's centre, anchor in the cosmos.",
    "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
    "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
    "Love is infinite. Happiness innate. Seeing, believing ....",
  ]);
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Add audio player ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Start uploading photos as soon as they're added
  useEffect(() => {
    const pendingPhotos = photos.filter(
      (p) => !p.uploadStatus || p.uploadStatus === "pending"
    );
    if (pendingPhotos.length > 0) {
      uploadPendingPhotos(pendingPhotos);
    }
  }, [photos]);

  const uploadPendingPhotos = async (pendingPhotos: PhotoUpload[]) => {
    const tempId = Math.random().toString(36).substring(7);

    for (let i = 0; i < pendingPhotos.length; i++) {
      const photo = pendingPhotos[i];
      setPhotos((prev) =>
        prev.map((p) => (p === photo ? { ...p, uploadStatus: "uploading" } : p))
      );

      try {
        const results = await uploadPhotos([photo.file], tempId);
        const result = results[0];

        setPhotos((prev) =>
          prev.map((p) =>
            p === photo
              ? {
                  ...p,
                  uploadStatus: "complete",
                  ipfsHash: result.ipfsHash,
                }
              : p
          )
        );
      } catch (error) {
        console.error(`Error uploading ${photo.file.name}:`, error);
        setPhotos((prev) =>
          prev.map((p) => (p === photo ? { ...p, uploadStatus: "error" } : p))
        );
      }
    }
  };

  const handleSongSelect = (songPath: string) => {
    setSelectedSongs((prev) => {
      if (prev.includes(songPath)) {
        return prev.filter((p) => p !== songPath);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), songPath];
      }
      return [...prev, songPath];
    });
  };

  const togglePlaySong = (songPath: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(songPath);
    }

    if (currentPlayingSong === songPath) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = songPath;
        audioRef.current.play();
      }
      setCurrentPlayingSong(songPath);
      setIsPlaying(true);
    }
  };

  const extractDateFromFileName = (fileName: string): string | null => {
    const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      try {
        const date = new Date(dateMatch[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        console.warn("Invalid date in filename:", fileName);
      }
    }
    return null;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPhotos = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        dateTaken:
          extractDateFromFileName(file.name) ||
          new Date(file.lastModified).toISOString(),
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);
      organizePhotosByMonth([...photos, ...newPhotos]);
    },
    [photos]
  );

  const organizePhotosByMonth = (photoList: PhotoUpload[]) => {
    const groups: { [key: string]: PhotoUpload[] } = {};

    photoList.forEach((photo) => {
      const date = new Date(photo.dateTaken || new Date());
      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }

      if (groups[monthKey].length < MAX_PHOTOS_PER_MONTH) {
        groups[monthKey].push(photo);
      }
    });

    const sortedGroups = Object.entries(groups)
      .map(([month, photos]) => ({ month, photos }))
      .sort((a, b) => {
        const dateA = new Date(a.photos[0].dateTaken || "");
        const dateB = new Date(b.photos[0].dateTaken || "");
        return dateA.getTime() - dateB.getTime();
      });

    setMonthGroups(sortedGroups);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    maxFiles: MAX_PHOTOS_PER_MONTH * 12, // Maximum 12 photos per month for a year
    maxSize: 10 * 1024 * 1024, // 10MB limit per file
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map((file) => ({
        name: file.file.name,
        errors: file.errors.map((err) => err.message),
      }));
      setUploadError(
        `Some files were rejected: ${JSON.stringify(errors, null, 2)}`
      );
    },
  });

  const handleMessageChange = (index: number, value: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[index] = value;
      return newMessages;
    });
  };

  const handleDateChange = (photoIndex: number, newDate: string) => {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[photoIndex] = {
        ...updated[photoIndex],
        dateTaken: new Date(newDate).toISOString(),
      };
      return updated;
    });
    organizePhotosByMonth(photos);
  };

  const handleComplete = async () => {
    if (!theme) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      // Filter out any failed uploads
      const successfulUploads = photos.filter(
        (p) => p.uploadStatus === "complete"
      );
      if (successfulUploads.length === 0) {
        throw new Error("No successfully uploaded photos");
      }

      const uploadedPhotos: ImageProps[] = successfulUploads.map(
        (photo, index) => ({
          id: index,
          ipfsHash: photo.ipfsHash!,
          name: photo.file.name,
          description: null,
          dateTaken: photo.dateTaken,
          dateModified: new Date().toISOString(),
          width: 1280,
          height: 720,
          groupId: photo.file.name,
        })
      );

      onComplete({
        theme,
        messages,
        photos: uploadedPhotos,
        giftId: uploadedPhotos[0].groupId!,
      });
    } catch (error) {
      console.error("Error creating gift:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to create gift"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const renderMusicSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Music (Max 2)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SONGS.map((song) => (
          <div
            key={song.path}
            className={`p-4 rounded-lg border ${
              selectedSongs.includes(song.path)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            } hover:border-blue-300 transition-colors cursor-pointer`}
            onClick={() => handleSongSelect(song.path)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{song.title}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlaySong(song.path);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  {currentPlayingSong === song.path && isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
                {selectedSongs.includes(song.path) && (
                  <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedSongs.length > 0 && (
        <p className="text-sm text-gray-600">
          Selected: {selectedSongs.length}/2 songs
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Your Own Gift
          </h2>
          <p className="text-gray-600 mt-1">
            Step {step} of 3:{" "}
            {step === 1
              ? "Choose Theme"
              : step === 2
              ? "Customize Messages"
              : "Upload Photos"}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setTheme("space")}
                className={`aspect-video rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-4 transition-all ${
                  theme === "space"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                }`}
              >
                <SparklesIcon className="w-12 h-12 text-blue-500" />
                <div className="text-center">
                  <h3 className="font-bold text-gray-900">Space</h3>
                  <p className="text-sm text-gray-600">
                    A cosmic journey through the stars
                  </p>
                </div>
              </button>

              <button
                onClick={() => setTheme("japanese")}
                className={`aspect-video rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-4 transition-all ${
                  theme === "japanese"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-200 hover:bg-gray-50"
                }`}
              >
                <svg
                  className="w-12 h-12 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 3c-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7C14.7 4.2 13.5 3 12 3z" />
                  <path d="M12 10.4c-2.3 0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2 4.2-1.9 4.2-4.2-1.9-4.2-4.2-4.2z" />
                  <path d="M12 20.6c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6z" />
                </svg>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900">Zen</h3>
                  <p className="text-sm text-gray-600">
                    A peaceful journey through memories
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Message {index + 1}
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => handleMessageChange(index, e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your message..."
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600">
                  Drag & drop photos here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports JPEG, PNG, and WebP (max 3 photos per month)
                </p>
              </div>

              {renderMusicSelection()}

              {monthGroups.length > 0 && (
                <div className="space-y-8">
                  {monthGroups.map((group, groupIndex) => (
                    <div key={group.month} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {group.month} ({group.photos.length}/12 photos)
                        </h3>
                        {group.photos.length >= MAX_PHOTOS_PER_MONTH && (
                          <span className="text-sm text-amber-600">
                            Month is full
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {group.photos.map((photo, photoIndex) => (
                          <div
                            key={`${groupIndex}-${photoIndex}`}
                            className="aspect-square rounded-lg bg-gray-100 relative group"
                          >
                            <Image
                              src={photo.preview}
                              alt={`Upload preview ${photoIndex + 1}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-4">
                              <input
                                type="date"
                                value={photo.dateTaken?.split("T")[0] || ""}
                                onChange={(e) =>
                                  handleDateChange(
                                    photos.indexOf(photo),
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 rounded bg-white/90 text-sm mb-2 w-full"
                              />
                              <div className="mb-2">
                                {photo.uploadStatus === "uploading" ? (
                                  <ArrowPathIcon className="w-5 h-5 text-white animate-spin" />
                                ) : photo.uploadStatus === "complete" ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : photo.uploadStatus === "error" ? (
                                  <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                                ) : null}
                              </div>
                              {photo.uploadStatus !== "uploading" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotos((prev) =>
                                      prev.filter((p) => p !== photo)
                                    );
                                    organizePhotosByMonth(
                                      photos.filter((p) => p !== photo)
                                    );
                                  }}
                                  className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Uploading photos... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => prev - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step === 3) {
                  handleComplete();
                } else {
                  setStep((prev) => prev + 1);
                }
              }}
              disabled={
                (step === 1 && !theme) ||
                (step === 3 && (photos.length === 0 || isUploading))
              }
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3
                ? isUploading
                  ? "Creating..."
                  : "Create Gift"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateGiftFlow;
