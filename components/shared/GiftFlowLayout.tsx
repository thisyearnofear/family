import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ProgressIndicator } from "./ProgressIndicator";
import type { Step } from "@utils/types/gift";

interface GiftFlowLayoutProps {
  children: React.ReactNode;
  currentStep: Step;
  steps: Step[];
  onClose: () => void;
}

export function GiftFlowLayout({
  children,
  currentStep,
  steps,
  onClose,
}: GiftFlowLayoutProps) {
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
            <ProgressIndicator currentStep={currentStep} steps={steps} />
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
