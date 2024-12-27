import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  SparklesIcon,
  PhotoIcon,
  PencilSquareIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { uploadPhotos } from "../utils/uploadPhotos";
import { createGift } from "../utils/gifts";
import type { ImageProps } from "../utils/types";
import type { Gift } from "../utils/gifts";

interface CreateGiftFlowProps {
  onClose: () => void;
  onComplete: (data: {
    theme: "space" | "japanese";
    messages: string[];
    photos: ImageProps[];
    giftId: string;
    password?: string;
  }) => void;
}

const CreateGiftFlow: React.FC<CreateGiftFlowProps> = ({
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<"space" | "japanese">();
  const [messages, setMessages] = useState<string[]>([
    "Welcome to a special journey...",
    "A collection of cherished memories...",
    "Each photo tells a story...",
    "Let's explore these moments together...",
  ]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [password, setPassword] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPhotos((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
  });

  const handleMessageChange = (index: number, value: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[index] = value;
      return newMessages;
    });
  };

  const handleComplete = async () => {
    if (!theme) return;
    setIsUploading(true);

    try {
      // Generate a temporary ID for the gift group
      const tempId = Math.random().toString(36).substring(7);

      // Upload photos to Pinata
      const totalPhotos = photos.length;
      const uploadedPhotos = [];

      for (let i = 0; i < photos.length; i++) {
        const results = await uploadPhotos([photos[i]], tempId);
        uploadedPhotos.push(...results);
        setUploadProgress(((i + 1) / totalPhotos) * 100);
      }

      // Create the gift
      const gift = createGift({
        theme,
        messages,
        photos: uploadedPhotos,
        password: password || undefined,
        groupId: uploadedPhotos[0].groupId, // All photos will be in the same group
      });

      onComplete({
        theme,
        messages,
        photos: uploadedPhotos,
        giftId: gift.id,
        password: password || undefined,
      });
    } catch (error) {
      console.error("Error creating gift:", error);
      // TODO: Show error message to user
    } finally {
      setIsUploading(false);
    }
  };

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
            <div className="space-y-6">
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
                  Supports JPEG, PNG, and WebP
                </p>
              </div>

              {photos.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    {photos.length} photos selected
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((file, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg bg-gray-100 relative"
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Upload preview ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotos((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password Protection (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a password to protect your gift..."
                />
                <p className="text-sm text-gray-500">
                  Leave blank for public access
                </p>
              </div>

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
                (step === 1 && !theme) || (step === 3 && photos.length === 0)
              }
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Create Gift" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateGiftFlow;
