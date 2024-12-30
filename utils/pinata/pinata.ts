import { PinataSDK } from "pinata-web3";
import axios from "axios";
import FormData from "form-data";
import type { ImageProps } from "../types/types";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
});

export interface IPFSImage {
  id: number;
  ipfsHash: string;
  name: string;
  width?: number;
  height?: number;
  dateTaken?: string;
  dateModified?: string;
}

export interface PinataGroup {
  id: string;
  name: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export async function pinFileToIPFS(file: File): Promise<{ IpfsHash: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        ...formData.getHeaders?.(),
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      maxContentLength: Infinity,
    }
  );

  return response.data;
}

interface PinataFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  number_of_files: number;
  mime_type: string;
  group_id: string | null;
  created_at: string;
}

interface PinataListResponse {
  files: PinataFile[];
  next_page_token?: string;
}

export const getImages = async (groupId: string): Promise<ImageProps[]> => {
  try {
    console.log("getImages: Starting with groupId:", groupId);

    if (!process.env.PINATA_JWT) {
      console.error("getImages: PINATA_JWT is not defined");
      throw new Error("PINATA_JWT is not configured");
    }

    // Use the SDK's listFiles method with group filter
    // Since 'files' property doesn't exist, let's use the pinList API directly
    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?groupId=${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const data = (await response.json()) as PinataListResponse;
    console.log("getImages: Retrieved files count:", data.files.length);

    // Map the files to our ImageProps format
    const images = data.files.map((file: PinataFile, index: number) => ({
      id: index,
      ipfsHash: file.cid,
      name: file.name || `Image ${index + 1}`,
      description: null,
      dateTaken: file.created_at,
      dateModified: file.created_at,
      width: 1280, // Default width
      height: 720, // Default height
    }));

    // Sort images by date
    const sortedImages = images.sort((a: ImageProps, b: ImageProps) => {
      if (!a.dateTaken || !b.dateTaken) return 0;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
    });

    console.log(
      "getImages: Processed and sorted images count:",
      sortedImages.length
    );
    return sortedImages;
  } catch (error) {
    console.error("getImages: Error fetching images:", error);

    // Fallback to direct group JSON fetch if API method fails
    try {
      console.log("getImages: Attempting fallback to dedicated gateway");
      const gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(
        /\/$/,
        ""
      );

      if (!gatewayUrl) {
        throw new Error("Pinata gateway not configured");
      }

      const groupResponse = await fetch(`${gatewayUrl}/${groupId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });

      if (!groupResponse.ok) {
        throw new Error(`Gateway fetch failed: ${groupResponse.status}`);
      }

      const groupData = await groupResponse.json();

      if (!groupData.images || !Array.isArray(groupData.images)) {
        throw new Error("Invalid group data format");
      }

      interface GroupImage {
        ipfsHash: string;
        name?: string;
        description?: string;
        dateTaken?: string;
        dateModified?: string;
        width?: number;
        height?: number;
      }

      return groupData.images.map((image: GroupImage, index: number) => ({
        id: index,
        ipfsHash: image.ipfsHash,
        name: image.name || `Image ${index + 1}`,
        description: image.description || null,
        dateTaken:
          image.dateTaken || image.dateModified || new Date().toISOString(),
        dateModified: image.dateModified || null,
        width: image.width || 1280,
        height: image.height || 720,
      }));
    } catch (fallbackError) {
      console.error("getImages: Fallback also failed:", fallbackError);
      throw fallbackError;
    }
  }
};

export async function createGiftGroup(giftId: string) {
  try {
    return await pinata.groups.create({
      name: `gift-${giftId}`,
    });
  } catch (error) {
    console.error("Error creating gift group:", error);
    throw error;
  }
}

export async function addFilesToGroup(groupId: string, cids: string[]) {
  try {
    await pinata.groups.addCids({
      groupId,
      cids,
    });
  } catch (error) {
    console.error("Error adding files to group:", error);
    throw error;
  }
}

export async function deleteGiftGroup(groupId: string) {
  try {
    await pinata.groups.delete({
      groupId,
    });
  } catch (error) {
    console.error("Error deleting gift group:", error);
    throw error;
  }
}

export interface CreateGiftCollection {
  photos: {
    ipfsHash: string;
    name: string;
    dateTaken?: string;
    dateModified?: string;
  }[];
  metadata?: {
    theme?: "space" | "japanese";
    messages?: string[];
  };
}

export async function createGiftCollection(data: CreateGiftCollection) {
  try {
    // Create a JSON file with the collection data
    const formData = new FormData();
    const blob = new Blob(
      [JSON.stringify({ images: data.photos, ...data.metadata })],
      {
        type: "application/json",
      }
    );
    formData.append("file", blob, "collection.json");

    // Upload the collection JSON to IPFS
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders?.(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error creating gift collection:", error);
    throw error;
  }
}
