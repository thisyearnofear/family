export interface LensProfile {
  id: string;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  address: string;
}

export interface LensChallenge {
  text: string;
  id: string;
}

export interface LensAuthentication {
  accessToken: string;
  refreshToken: string;
}

export interface LensPermissions {
  canFollow: boolean;
  canCollect: boolean;
  canMirror: boolean;
  canComment: boolean;
}

// Invite-specific types
export interface LensInvite {
  id: string;
  from: LensProfile;
  to: string; // address or handle
  giftId: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  expiresAt?: string;
}

export interface LensNotification {
  id: string;
  type: "invite" | "update" | "mention";
  from: LensProfile;
  to: LensProfile;
  giftId?: string;
  message: string;
  createdAt: string;
  read: boolean;
}
