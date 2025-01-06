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
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { createGift } from "../../utils/api/pinata";
import {
  createGiftData,
  downloadGiftInfo,
  copyToClipboard,
} from "../../utils/helpers";
import type { ImageProps } from "../../utils/types/types";
import MonthlyCollage from "./MonthlyCollage";
import { useTheme } from "../../contexts/ThemeContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { SONGS } from "../../utils/constants";

interface Photo {
  file: File;
  preview: string;
  dateTaken: string;
}

interface UploadStatus {
  giftId: string | null;
  isUploading: boolean;
  error: string | null;
  progress: number;
  status: "uploading" | "verifying" | "ready" | "pending" | "error";
  pendingCids?: string[];
}

type Step = "theme" | "photos" | "messages" | "music" | "preview" | "confirm";

const getNextStep = (currentStep: Step): Step | null => {
  switch (currentStep) {
    case "theme":
      return "photos";
    case "photos":
      return "messages";
    case "messages":
      return "music";
    case "music":
      return "preview";
    case "preview":
      return "confirm";
    default:
      return null;
  }
};

const getPreviousStep = (currentStep: Step): Step | null => {
  switch (currentStep) {
    case "photos":
      return "theme";
    case "messages":
      return "photos";
    case "music":
      return "messages";
    case "preview":
      return "music";
    case "confirm":
      return "preview";
    default:
      return null;
  }
};

interface CreateGiftData {
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  giftId: string;
  title?: string;
}

interface CreateGiftFlowProps {
  onComplete: (data: CreateGiftData) => Promise<void>;
  onClose: () => void;
  onGiftCreated: (giftId: string) => void;
}

export default function CreateGiftFlow({
  onComplete,
  onClose,
  onGiftCreated,
}: CreateGiftFlowProps) {
  const [step, setStep] = useState<Step>("theme");
  const [theme, setTheme] = useState<"space" | "japanese">("space");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    giftId: null,
    isUploading: false,
    error: null,
    progress: 0,
    status: "uploading",
  });
  const [title, setTitle] = useState<string>("A Year in Memories");

  const { isPlaying, currentPlayingSong, togglePlaySong } = useAudioPlayer();

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      dateTaken: new Date(file.lastModified).toISOString(),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, [photos]);

  const handleComplete = async () => {
    setUploadStatus((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: 0,
      status: "uploading",
    }));

    try {
      // Creating group
      setUploadStatus((prev) => ({
        ...prev,
        progress: 10,
        status: "uploading",
      }));

      // Start uploading files
      setUploadStatus((prev) => ({
        ...prev,
        progress: 20,
        status: "uploading",
      }));

      // Create a map of filename to custom dates
      const customDates = photos.reduce((acc, photo) => {
        acc[photo.file.name] = photo.dateTaken;
        return acc;
      }, {} as { [filename: string]: string });

      const result = await createGift(
        photos.map((p) => p.file),
        theme,
        messages,
        selectedSongs,
        title,
        customDates
      );

      // Files uploaded, verifying
      setUploadStatus((prev) => ({
        ...prev,
        giftId: result.giftId,
        progress: 80,
        status: "verifying",
      }));

      await copyToClipboard(result.giftId);

      // Update final status
      setUploadStatus((prev) => ({
        ...prev,
        progress: 100,
        status: result.status,
        pendingCids: result.pendingCids,
      }));
    } catch (error) {
      console.error("Error creating gift:", error);
      setUploadStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to create gift",
        status: "error",
      }));
    }
  };

  const handleDownloadAndClose = () => {
    if (!uploadStatus.giftId) return;
    downloadGiftInfo(uploadStatus.giftId, theme);
    onGiftCreated(uploadStatus.giftId);
    onComplete(
      createGiftData(uploadStatus.giftId, theme, messages, photos, title)
    );
    onClose();
  };

  const handleCloseWithoutDownload = () => {
    if (!uploadStatus.giftId) return;
    onGiftCreated(uploadStatus.giftId);
    onComplete(
      createGiftData(uploadStatus.giftId, theme, messages, photos, title)
    );
    onClose();
  };

  const renderPhotoUploadGuidance = () => (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-700 text-center">
      <p>Photos will be automatically organized by date taken.</p>
      <ul className="mt-2 space-y-1">
        <li>• Upload up to 3 photos for any month</li>
        <li>• Hover over photos to adjust their dates</li>
        <li>• You can preview and edit everything before finalizing</li>
      </ul>
    </div>
  );

  const renderMusicSelection = () => (
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
        {SONGS.map((song) => (
          <div
            key={song.path}
            className={`p-4 rounded-lg border ${
              selectedSongs.includes(song.path)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            } hover:border-blue-300 transition-colors cursor-pointer`}
            onClick={() => {
              if (selectedSongs.includes(song.path)) {
                setSelectedSongs(selectedSongs.filter((s) => s !== song.path));
              } else if (selectedSongs.length < 2) {
                setSelectedSongs([...selectedSongs, song.path]);
              }
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

  const renderThemeCard = (selectedTheme: "space" | "japanese") => (
    <div
      className={`aspect-video rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-4 ${
        selectedTheme === "space"
          ? "border-blue-500 bg-blue-50"
          : "border-red-500 bg-red-50"
      }`}
    >
      {selectedTheme === "space" ? (
        <>
          <SparklesIcon className="w-12 h-12 text-blue-500" />
          <div className="text-center">
            <h3 className="font-bold text-gray-900">Space</h3>
            <p className="text-sm text-gray-600">
              A cosmic journey through the stars
            </p>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  const renderTitleInput = () => (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-semibold">Customize Title</h3>
      <p className="text-sm text-gray-600 mb-6">
        This will be shown in the final gallery view
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for your gift"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const renderMessageInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Add Messages</h3>
      <p className="text-sm text-gray-600 text-center mb-6">
        Add personal messages that will appear during the gift experience
      </p>
      {messages.map((message, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            value={message}
            onChange={(e) => {
              const newMessages = [...messages];
              newMessages[index] = e.target.value;
              setMessages(newMessages);
            }}
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={2}
            placeholder="Enter your message..."
          />
          <button
            onClick={() => setMessages(messages.filter((_, i) => i !== index))}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
      {messages.length < 5 && (
        <button
          onClick={() => setMessages([...messages, ""])}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
        >
          + Add Message
        </button>
      )}
    </div>
  );

  const handleNextStep = useCallback(() => {
    const nextStep = getNextStep(step);
    if (nextStep) {
      setStep(nextStep);
    }
  }, [step]);

  const handlePreviousStep = useCallback(() => {
    const prevStep = getPreviousStep(step);
    if (prevStep) {
      setStep(prevStep);
    }
  }, [step]);

  const renderStepContent = () => {
    switch (step) {
      case "theme":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Choose Theme</h2>
            <p className="text-center text-gray-600">
              Select a theme for your gift experience
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => {
                  setTheme("space");
                  handleNextStep();
                }}
                className="focus:outline-none"
              >
                {renderThemeCard("space")}
              </button>
              <button
                onClick={() => {
                  setTheme("japanese");
                  handleNextStep();
                }}
                className="focus:outline-none"
              >
                {renderThemeCard("japanese")}
              </button>
            </div>
          </div>
        );
      case "photos":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Upload Photos
            </h2>
            {renderPhotoUploadGuidance()}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-4 text-sm text-gray-600">
                Drag & drop photos here, or click to select
              </p>
            </div>

            {photos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Uploaded Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square group">
                      <Image
                        src={photo.preview}
                        alt={`Uploaded photo ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPhotos(photos.filter((_, i) => i !== index));
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white">
                          {format(new Date(photo.dateTaken), "MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={photos.length === 0}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "messages":
        const defaultMessages = [
          "Family is constant — gravity&apos;s centre, anchor in the cosmos.",
          "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
          "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
          "Love is infinite. Happiness innate. Seeing, believing ....",
        ];
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                Add Messages
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Add personal messages for the gift experience. <br /> If no
                messages are added, the default ones will be used.
              </p>

              {messages.map((message, index) => (
                <div key={index} className="flex items-start gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      const newMessages = [...messages];
                      newMessages[index] = e.target.value;
                      setMessages(newMessages);
                    }}
                    className="flex-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder={
                      defaultMessages[index % defaultMessages.length]
                    }
                  />
                  <button
                    onClick={() =>
                      setMessages(messages.filter((_, i) => i !== index))
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {messages.length < 5 && (
                <button
                  onClick={() => setMessages([...messages, ""])}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
                >
                  + Add Message
                </button>
              )}
            </div>
            {renderTitleInput()}
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "music":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Select Music</h2>
            {renderMusicSelection()}
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "preview":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Preview</h2>
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Theme Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg text-center font-medium mb-4">
                  Selected Theme
                </h3>
                <div className="w-full max-w-md mx-auto">
                  {renderThemeCard(theme)}
                </div>
              </div>

              {/* Photos Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg text-center font-medium mb-4">
                  Your Photos
                </h3>
                <MonthlyCollage photos={photos} onPhotosChange={setPhotos} />
              </div>

              {/* Messages Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg text-center font-medium mb-4">
                  Your Messages
                </h3>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Music Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg text-center font-medium mb-4">
                  Selected Music
                </h3>
                <div className="space-y-4">
                  {selectedSongs.map((songPath) => {
                    const song = SONGS.find((s) => s.path === songPath);
                    return (
                      <div
                        key={songPath}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                      >
                        <span className="font-medium">{song?.title}</span>
                        <button
                          onClick={() => togglePlaySong(songPath)}
                          className="p-2 rounded-full hover:bg-gray-200"
                        >
                          {currentPlayingSong === songPath && isPlaying ? (
                            <PauseIcon className="w-5 h-5" />
                          ) : (
                            <PlayIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "confirm":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Confirm</h2>
            <div className="max-w-xl mx-auto space-y-4 text-center">
              <p className="text-gray-600">
                Your gift is ready to be created! Please review the following:
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>
                    {photos.length} photos organized into{" "}
                    {
                      Array.from(
                        new Set(
                          photos.map((p) =>
                            new Date(p.dateTaken).toISOString().slice(0, 7)
                          )
                        )
                      ).length
                    }{" "}
                    months
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>
                    {messages.length} message{messages.length !== 1 && "s"}{" "}
                    added
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>
                    {selectedSongs.length} song
                    {selectedSongs.length !== 1 && "s"} selected
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Theme: {theme === "space" ? "Space" : "Japanese"}</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                Click Create Gift to finalize and get your gift ID
              </p>
            </div>
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-3 sm:px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Gift
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderUploadStatus = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return "Creating your gift...";
      case "verifying":
        return "Verifying files...";
      case "ready":
        return "Gift created successfully!";
      case "pending":
        return "Almost ready...";
      case "error":
        return "Error creating gift";
      default:
        return "Processing...";
    }
  };

  const renderProgressIndicator = () => {
    const steps: Step[] = [
      "theme",
      "photos",
      "messages",
      "music",
      "preview",
      "confirm",
    ];
    const currentIndex = steps.indexOf(step);

    return (
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              index <= currentIndex ? "bg-blue-600" : "bg-gray-200"
            } ${index === 0 || index === steps.length - 1 ? "w-4" : "w-8"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto">
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            {renderProgressIndicator()}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-8">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Upload progress overlay */}
      {uploadStatus.isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg max-w-md w-full mx-auto">
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                {uploadStatus.status === "ready" ? (
                  <CheckCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto" />
                ) : uploadStatus.status === "error" ? (
                  <ExclamationCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto" />
                ) : (
                  <ArrowPathIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mx-auto animate-spin" />
                )}
                <h3 className="text-lg sm:text-xl font-semibold mt-3 sm:mt-4">
                  {uploadStatus.status === "uploading" &&
                    "📦 Creating your gift..."}
                  {uploadStatus.status === "verifying" &&
                    "⏳ Verifying files..."}
                  {uploadStatus.status === "ready" &&
                    "✨ Gift created successfully!"}
                  {uploadStatus.status === "pending" && " Almost ready..."}
                  {uploadStatus.status === "error" && "Error creating gift"}
                </h3>
                {uploadStatus.status === "uploading" && (
                  <p className="text-sm text-gray-600 mt-2">
                    🖼️ Uploading images to IPFS...
                  </p>
                )}
                {uploadStatus.status === "verifying" && (
                  <p className="text-sm text-gray-600 mt-2">
                    📄 Creating gift metadata...
                  </p>
                )}
                {uploadStatus.status === "pending" && (
                  <p className="text-sm text-gray-600 mt-2">
                    😇 Some files are still processing but you can safely exit
                  </p>
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>

              {uploadStatus.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-700">{uploadStatus.error}</p>
                  <button
                    onClick={() =>
                      setUploadStatus((prev) => ({
                        ...prev,
                        isUploading: false,
                      }))
                    }
                    className="mt-3 w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {uploadStatus.giftId &&
                (uploadStatus.status === "ready" ||
                  uploadStatus.status === "pending") && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <p className="font-medium text-center mb-2 text-sm sm:text-base">
                        Your Gift ID
                      </p>
                      <p className="text-center font-mono text-xs sm:text-sm bg-white p-2 rounded border break-all">
                        {uploadStatus.giftId}
                      </p>
                    </div>

                    {uploadStatus.status === "pending" && (
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          The experience is safely stored on IPFS and will be
                          available shortly. Try unwrapping the gift in a
                          moment.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                      <p>
                        • Keep this ID safe - you&apos;ll need it to share your
                        gift
                      </p>
                      <p>• Your photos are stored privately and securely</p>
                      <p>• Only people with this ID can view your gift</p>
                      <p>• The gift will be shown in {theme} theme</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                      <button
                        onClick={() => copyToClipboard(uploadStatus.giftId!)}
                        className="w-full px-4 py-2 text-sm-mobile sm:text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Copy Gift ID
                      </button>
                      <button
                        onClick={() =>
                          downloadGiftInfo(uploadStatus.giftId!, theme)
                        }
                        className="w-full px-4 py-2 text-sm-mobile sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Download Gift Info
                      </button>
                      <button
                        onClick={handleCloseWithoutDownload}
                        className="w-full px-4 py-2 text-sm-mobile sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
