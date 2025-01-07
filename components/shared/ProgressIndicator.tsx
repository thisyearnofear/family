import type { Step } from "@utils/types/gift";

interface ProgressIndicatorProps {
  currentStep: Step;
  steps: Step[];
}

const STEP_LABELS: Record<Step, string> = {
  theme: "Choose Theme",
  photos: "Upload Photos",
  messages: "Add Messages",
  music: "Select Music",
  preview: "Preview",
  wallet: "Connect Wallet",
  permissions: "Set Access",
  collaborators: "Add Collaborators",
  confirm: "Create Gift",
};

export function ProgressIndicator({
  currentStep,
  steps,
}: ProgressIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              index <= currentIndex ? "bg-blue-600" : "bg-gray-200"
            } ${index === 0 || index === steps.length - 1 ? "w-4" : "w-8"}`}
          />
        ))}
      </div>
      <div className="text-center text-sm text-gray-600">
        Step {currentIndex + 1} of {steps.length}: {STEP_LABELS[currentStep]}
      </div>
    </div>
  );
}
