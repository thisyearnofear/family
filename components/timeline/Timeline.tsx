import { useTheme } from "../../contexts/ThemeContext";
import type { ImageProps } from "../../utils/types";
import ThemeSelector from "../themes/ThemeSelector";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

interface TimelineProps {
  images: ImageProps[];
}

interface ThemeComponentProps {
  images: ImageProps[];
  // Add any other shared props here
}

const Timeline: React.FC<TimelineProps> = ({ images }) => {
  console.log("Timeline Component Mounted", { imagesCount: images?.length });

  const { theme, setTheme } = useTheme();
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false);

  // Dynamically import themes to reduce initial bundle size
  const SpaceTimeline = dynamic<ThemeComponentProps>(
    () => import("./SpaceTimeline").then((mod) => mod.default as any),
    {
      loading: () => {
        console.log("Loading SpaceTimeline component...");
        return <div>Loading...</div>;
      },
    }
  );
  const JapaneseTimeline = dynamic<ThemeComponentProps>(
    () => import("./JapaneseTimeline").then((mod) => mod.default as any),
    {
      loading: () => {
        console.log("Loading JapaneseTimeline component...");
        return <div>Loading...</div>;
      },
    }
  );

  useEffect(() => {
    console.log("Timeline Effect Running", {
      hasSelectedTheme,
      currentTheme: theme,
    });
  }, [hasSelectedTheme, theme]);

  if (!hasSelectedTheme) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="max-w-2xl text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Your Memory Journey
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            You&apos;ve been sent an interactive gift experience. Choose your
            preferred style below to begin exploring your memories.
          </p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={() => {
              setTheme("space");
              setHasSelectedTheme(true);
            }}
            className="px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>Space Journey</span>
            <span>🚀</span>
          </button>
          <button
            onClick={() => {
              setTheme("japanese");
              setHasSelectedTheme(true);
            }}
            className="px-8 py-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <span>Zen Garden</span>
            <span>🌳</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeSelector />
      </div>
      {theme === "space" ? (
        <SpaceTimeline images={images} />
      ) : (
        <JapaneseTimeline images={images} />
      )}
    </>
  );
};

export default Timeline;
