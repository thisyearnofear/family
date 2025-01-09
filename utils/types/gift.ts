export type GiftTheme = "space" | "japanese";

export interface Photo {
  file: File;
  preview: string;
  dateTaken: string;
  originalDate?: string;
  isExisting: boolean;
  isNew: boolean;
  isDateModified: boolean;
  isDeleted?: boolean;
  ipfsHash?: string;
}

export interface UploadStatus {
  status: "idle" | "uploading" | "verifying" | "ready" | "error";
  isUploading: boolean;
  message?: string;
  error?: string;
  uploadedFiles?: number;
  totalFiles?: number;
  giftId?: string;
  ipfsHash?: string;
}

export interface CreateGiftData {
  theme: GiftTheme;
  messages: string[];
  photos: {
    file: File;
    preview: string;
    dateTaken: string;
    userDefinedDate?: string;
  }[];
  giftId: string;
  title: string;
  music?: string[];
}

export type Step =
  | "theme"
  | "photos"
  | "messages"
  | "music"
  | "preview"
  | "wallet"
  | "permissions"
  | "collaborators"
  | "confirm";

export interface GiftMetadata {
  theme: GiftTheme;
  title: string;
  messages: string[];
  music?: string[];
  photos: {
    url: string;
    dateTaken: string;
    description?: string;
  }[];
  createdAt: string;
  owner?: string;
  version: number;
  lastModified: string;
}

export interface TransactionStatus {
  isConfirming: boolean;
  isConfirmed: boolean;
  hash?: string;
}

export type Role = "editor" | "viewer";

export interface Invite {
  from: string;
  to: string;
  giftId: string;
  role: Role;
  createdAt: number;
  expiresAt: number;
  accepted: boolean;
  cancelled: boolean;
}

export type ContractFunctionName =
  | "createInvite"
  | "acceptInvite"
  | "cancelInvite"
  | "setGiftOwner"
  | "removeEditor";

export interface CurrentInvite {
  address: string;
  role: Role;
  handle?: string;
  displayName?: string;
  avatar?: string;
  invitedAt: string;
  expiresAt?: string;
  status: "pending" | "accepted" | "rejected" | "removed";
}

export interface CreateGiftInviteArgs {
  to: `0x${string}`;
  giftId: string;
  role: Role;
  expiresIn: bigint;
}
