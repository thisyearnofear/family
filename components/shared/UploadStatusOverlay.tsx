import {
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import type { UploadStatus, GiftTheme } from "@utils/types/gift";

interface UploadStatusOverlayProps {
  status: UploadStatus;
  theme: GiftTheme;
  onDownload: () => void;
  onClose: () => void;
  onCopyId: () => void;
  children?: React.ReactNode;
}

export function UploadStatusOverlay({
  status,
  theme,
  onDownload,
  onClose,
  onCopyId,
  children,
}: UploadStatusOverlayProps) {
  // Calculate overall progress based on upload state
  const progress = Math.min(
    Math.max(
      status.status === "uploading"
        ? ((status.uploadedFiles || 0) / (status.totalFiles || 1)) * 70 // Up to 70% for uploads
        : status.status === "verifying"
          ? 85 // Metadata creation
          : status.status === "pending"
            ? 95 // Waiting for processing
            : status.status === "ready"
              ? 100
              : 0,
      0
    ),
    100
  );

  const getStatusMessage = () => {
    switch (status.status) {
      case "uploading":
        if (status.uploadedFiles && status.totalFiles) {
          return `Uploading photos (${status.uploadedFiles}/${status.totalFiles})`;
        }
        return "Preparing your photos...";
      case "verifying":
        return "Creating your gift...";
      case "pending":
        return "Processing your photos...";
      case "ready":
        return "Gift created successfully!";
      case "error":
        return "Error creating gift";
      default:
        return "Getting started...";
    }
  };

  const getStatusDetails = () => {
    switch (status.status) {
      case "uploading":
        return "🖼️ Storing your memories securely...";
      case "verifying":
        return "📄 Creating your gift metadata...";
      case "pending":
        return "⏳ Almost there! Processing your photos...";
      case "ready":
        return "✨ All done! Your gift is ready to share";
      case "error":
        return "❌ Something went wrong";
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (status.status === "ready") {
      return (
        <CheckCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto" />
      );
    }
    if (status.status === "error") {
      return (
        <ExclamationCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto" />
      );
    }
    return (
      <ArrowPathIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mx-auto animate-spin" />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            {getStatusIcon()}
            <h3 className="text-lg sm:text-xl font-semibold mt-3 sm:mt-4">
              {getStatusMessage()}
            </h3>
            {getStatusDetails() && (
              <p className="text-sm text-gray-600 mt-2">{getStatusDetails()}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {status.status === "ready" && (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700 font-medium">
                  Your gift has been created!
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                <p>
                  • Keep this ID safe - you&apos;ll need it to share your gift
                </p>
                <p>• Your photos are stored privately and securely</p>
                <p>• Only people with this ID can view your gift</p>
                <p>• The gift will be shown in {theme} theme</p>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={onCopyId}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy Gift ID
                </button>
                <button
                  onClick={onDownload}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Download Gift Info
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
