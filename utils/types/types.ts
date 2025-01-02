/* eslint-disable no-unused-vars */

// Base image properties
export interface ImageProps {
  id: number;
  ipfsHash: string;
  name: string;
  description: string | null;
  dateTaken?: string;
  dateModified?: string;
  width: number;
  height: number;
  groupId?: string;
  blurDataUrl?: string;
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

// Pinata API responses
export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataMetadata {
  name?: string;
  keyvalues?: Record<string, string>;
}

export interface PinJSONOptions {
  pinataMetadata?: PinataMetadata;
}

export interface PinataFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  number_of_files: number;
  mime_type: string;
  group_id: string | null;
  created_at: string;
}

export interface PinataListResponse {
  files: PinataFile[];
  next_page_token?: string;
}

// Upload types
export interface UploadResult {
  id: number;
  ipfsHash: string;
  name: string;
  width?: number;
  height?: number;
  dateTaken?: string;
  dateModified?: string;
  description: string | null;
  groupId?: string;
}

// Gift types
export interface Gift {
  id: string;
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  groupId: string;
  createdAt: string;
  musicPreference?: {
    volume: number;
    isPlaying: boolean;
    currentTrack?: string;
  };
}

export interface CreateGiftParams {
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  groupId: string;
  musicPreference?: {
    volume: number;
    isPlaying: boolean;
    currentTrack?: string;
  };
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

export interface FileListResponse {
  items: Array<{
    id: string;
    name: string | null;
    cid: string;
    size: number;
    groupId: string | null;
    createdAt: string;
    updatedAt: string;
    metadata?: {
      keyValues?: {
        dateTaken?: string;
        [key: string]: any;
      };
    };
  }>;
  total: number;
  pageSize: number;
  pageNumber: number;
}
