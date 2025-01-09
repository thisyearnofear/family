import { useState, useCallback } from "react";
import { useTheme } from "@contexts/ThemeContext";

export type GiftTheme = "space" | "japanese";

interface ThemeOption {
  id: GiftTheme;
  title: string;
  description: string;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    hover: string;
  };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "space",
    title: "Space Journey",
    description: "A cosmic journey through the stars",
    emoji: "🚀",
    colors: {
      primary: "bg-blue-600",
      secondary: "bg-blue-100",
      text: "text-blue-900",
      hover: "hover:bg-blue-200",
    },
  },
  {
    id: "japanese",
    title: "Zen Garden",
    description: "A peaceful journey through memories",
    emoji: "🌳",
    colors: {
      primary: "bg-red-600",
      secondary: "bg-red-100",
      text: "text-red-900",
      hover: "hover:bg-red-200",
    },
  },
] as const;

export function useThemeSelection(initialTheme: GiftTheme = "space") {
  const { setTheme: setGlobalTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<GiftTheme>(initialTheme);

  const selectTheme = useCallback(
    (theme: GiftTheme) => {
      setSelectedTheme(theme);
      setGlobalTheme(theme);
    },
    [setGlobalTheme]
  );

  const getThemeOption = useCallback((themeId: GiftTheme) => {
    return THEME_OPTIONS.find((option) => option.id === themeId)!;
  }, []);

  return {
    selectedTheme,
    selectTheme,
    getThemeOption,
    themeOptions: THEME_OPTIONS,
  };
}
