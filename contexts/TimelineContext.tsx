import { createContext, useContext, useReducer, ReactNode } from "react";
import type { ImageProps } from "../utils/types/types";

interface TimelineState {
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  groupedImages: MonthGroup[];
  theme: "space" | "japanese";
}

interface MonthGroup {
  month: string;
  images: ImageProps[];
}

type TimelineAction =
  | { type: "NEXT_IMAGE" }
  | { type: "PREVIOUS_IMAGE" }
  | { type: "SET_INDEX"; payload: number }
  | { type: "TOGGLE_PLAYING" }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_IMAGES"; payload: ImageProps[] }
  | { type: "SET_THEME"; payload: "space" | "japanese" };

const TimelineContext = createContext<{
  state: TimelineState;
  dispatch: React.Dispatch<TimelineAction>;
} | null>(null);

const groupImagesByMonth = (images: ImageProps[]): MonthGroup[] => {
  if (!images || !Array.isArray(images)) return [];

  // Sort images by date
  const sortedImages = [...images].sort((a, b) => {
    if (!a.dateTaken || !b.dateTaken) return 0;
    return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
  });

  // Create a map to store images by month
  const monthMap = new Map<string, ImageProps[]>();

  // Group images by month
  sortedImages.forEach((image) => {
    if (!image.dateTaken) return;
    const date = new Date(image.dateTaken);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthName = date.toLocaleString("default", { month: "long" });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)?.push(image);
  });

  // Convert map to array and sort by date
  const groups = Array.from(monthMap.entries())
    .map(([key, images]) => ({
      month: new Date(images[0].dateTaken!).toLocaleString("default", {
        month: "long",
      }),
      images: images.slice(0, 10), // Limit to 10 images per month
    }))
    .sort((a, b) => {
      const dateA = new Date(a.images[0].dateTaken!);
      const dateB = new Date(b.images[0].dateTaken!);
      return dateA.getTime() - dateB.getTime();
    });

  return groups;
};

const timelineReducer = (
  state: TimelineState,
  action: TimelineAction
): TimelineState => {
  switch (action.type) {
    case "NEXT_IMAGE":
      return {
        ...state,
        currentIndex: Math.min(
          state.currentIndex + 1,
          state.groupedImages.flatMap((g) => g.images).length - 1
        ),
      };
    case "PREVIOUS_IMAGE":
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };
    case "SET_INDEX":
      return {
        ...state,
        currentIndex: action.payload,
      };
    case "TOGGLE_PLAYING":
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case "SET_VOLUME":
      return {
        ...state,
        volume: action.payload,
      };
    case "SET_IMAGES":
      return {
        ...state,
        groupedImages: groupImagesByMonth(action.payload),
      };
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
};

export const TimelineProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(timelineReducer, {
    currentIndex: 0,
    isPlaying: true,
    volume: 0.5,
    groupedImages: [],
    theme: "japanese",
  });

  return (
    <TimelineContext.Provider value={{ state, dispatch }}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
};
