import { SparklesIcon } from "@heroicons/react/24/outline";
import type { GiftTheme } from "@utils/types/gift";

interface ThemeSelectionProps {
  onThemeSelect: (theme: GiftTheme) => void;
}

export function ThemeSelection({ onThemeSelect }: ThemeSelectionProps) {
  const renderThemeCard = (theme: GiftTheme) => (
    <div
      className={`aspect-video rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-4 ${
        theme === "space"
          ? "border-blue-500 bg-blue-50"
          : "border-red-500 bg-red-50"
      }`}
    >
      {theme === "space" ? (
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Choose Theme</h2>
      <p className="text-center text-gray-600">
        Select a theme for your gift experience
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button
          onClick={() => onThemeSelect("space")}
          className="focus:outline-none"
        >
          {renderThemeCard("space")}
        </button>
        <button
          onClick={() => onThemeSelect("japanese")}
          className="focus:outline-none"
        >
          {renderThemeCard("japanese")}
        </button>
      </div>
    </div>
  );
}
