import type { ImageProps } from "@utils/types";
import { pinJSONToIPFS, getJSONFromIPFS } from "../pinata";

export interface Gift {
  id: string; // This will be the IPFS hash
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

export async function createGift(params: CreateGiftParams): Promise<Gift> {
  const gift: Omit<Gift, "id" | "createdAt"> = {
    theme: params.theme,
    messages: params.messages,
    photos: params.photos,
    groupId: params.groupId,
    musicPreference: params.musicPreference,
  };

  try {
    // Pin the gift metadata to IPFS
    const response = await pinJSONToIPFS(gift, {
      pinataMetadata: {
        name: `FamilyWrapped Gift - ${new Date().toISOString()}`,
        keyvalues: {
          type: "familywrapped-gift",
          theme: params.theme,
          groupId: params.groupId,
        },
      },
    });

    // Return the complete gift object with the IPFS hash as the ID
    return {
      ...gift,
      id: response.IpfsHash,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating gift:", error);
    throw new Error("Failed to create gift");
  }
}

export async function getGift(id: string): Promise<Gift | null> {
  try {
    // Fetch the gift metadata from IPFS
    const giftData = await getJSONFromIPFS(id);

    if (!giftData) {
      return null;
    }

    // Return the complete gift object
    return {
      ...giftData,
      id,
      createdAt: giftData.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching gift:", error);
    return null;
  }
}

// We can also add a function to list gifts by groupId if needed
export async function listGiftsByGroupId(groupId: string): Promise<Gift[]> {
  // TODO: Use Pinata's filtering API to fetch all gifts with matching groupId
  return [];
}
