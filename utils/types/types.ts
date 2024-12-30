/* eslint-disable no-unused-vars */

// Core image type used throughout the application
export interface ImageProps {
  id: number;
  ipfsHash: string;
  name: string;
  width: number;
  height: number;
  dateTaken?: string;
  dateModified?: string;
  description?: string | null;
  blurDataUrl?: string;
  groupId?: string;
}

// Modal related types
export interface SharedModalProps {
  index: number;
  images?: ImageProps[];
  currentPhoto?: ImageProps;
  changePhotoId: (newVal: number) => void;
  closeModal: () => void;
  navigation: boolean;
  direction?: number;
}

// Gift related types
export interface GiftData {
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  password?: string;
  groupId: string;
}

// Timeline related types
export interface TimelineProps {
  images: ImageProps[];
  isAutoHighlighting?: boolean;
  setIsAutoHighlighting?: (value: boolean) => void;
}

// Loading state types
export interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    loadedCount: number;
    totalCount: number;
  };
}
