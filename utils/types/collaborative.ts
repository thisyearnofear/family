import { Gift } from "./types";

export interface Editor {
  address: string;
  role: "editor" | "viewer";
  handle?: string;
  displayName?: string;
  avatar?: string;
  addedAt: string;
}

export interface PendingInvite {
  inviteeAddress: string;
  role: "editor" | "viewer";
  handle?: string;
  displayName?: string;
  avatar?: string;
  invitedAt: string;
  expiresAt?: string;
  status: "pending" | "accepted" | "rejected";
}

export interface CollaborativeGift {
  giftId: string;
  owner: string;
  editors?: Editor[];
  pendingInvites?: PendingInvite[];
  version: number;
  lastModified: string;
  title?: string;
  theme: "space" | "japanese";
  photos: {
    id: string;
    url: string;
    description?: string;
    dateTaken: string;
  }[];
  messages: string[];
  music?: string[];
}

export interface GiftPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
}

export interface EditorInvite {
  giftId: string;
  invitedBy: string; // wallet address
  invitedAddress: string;
  role: "editor";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
}
