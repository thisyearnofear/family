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

export const getImages = async (groupId: string): Promise<ImageProps[]> => {
  try {
    console.log("getImages: Starting with groupId:", groupId);

    if (!process.env.PINATA_JWT) {
      console.error("getImages: PINATA_JWT is not defined");
      throw new Error("PINATA_JWT is not configured");
    }

    // First, try to fetch the group JSON directly
    const groupResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${groupId}`,
      {
        method: "GET",
      }
    );

    if (groupResponse.ok) {
      console.log("getImages: Successfully fetched group JSON");
      const groupData = await groupResponse.json();
      console.log("getImages: Group data:", {
        hasImages: !!groupData.images,
        imageCount: groupData.images?.length,
      });

      if (groupData.images && Array.isArray(groupData.images)) {
        return groupData.images.map((image: any, index: number) => ({
          id: index,
          ipfsHash: image.ipfsHash,
          name: image.name || `Image ${index + 1}`,
          description: image.description || null,
          dateModified: image.dateModified || new Date().toISOString(),
          width: image.width || 1280,
          height: image.height || 720,
        }));
      }
    }

    // If group JSON fetch fails, try the pin list API
    console.log("getImages: Falling back to pin list API");
    const pinListResponse = await fetch(
      `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues][groupId][value]=${groupId}&metadata[keyvalues][groupId][op]=eq`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!pinListResponse.ok) {
      console.error("getImages: Pinata API error:", {
        status: pinListResponse.status,
        statusText: pinListResponse.statusText,
      });
      const errorText = await pinListResponse.text();
      console.error("getImages: Error response:", errorText);
      throw new Error(
        `Pinata API error: ${pinListResponse.status} ${pinListResponse.statusText}`
      );
    }

    const data = await pinListResponse.json();
    console.log("getImages: Received pin list response:", {
      hasRows: !!data.rows,
      rowCount: data.rows?.length,
      count: data.count,
      firstRow: data.rows?.[0]
        ? {
            hash: data.rows[0].ipfs_pin_hash,
            hasMetadata: !!data.rows[0].metadata,
            hasKeyValues: !!data.rows[0].metadata?.keyvalues,
          }
        : null,
    });

    if (!data.rows) {
      console.error("getImages: No rows in response");
      return [];
    }

    const images = data.rows.map((row: any, index: number) => ({
      id: index,
      ipfsHash: row.ipfs_pin_hash,
      name: row.metadata?.name || `Image ${row.ipfs_pin_hash.slice(0, 8)}`,
      description: row.metadata?.keyvalues?.description || null,
      dateModified: row.date_pinned || new Date().toISOString(),
      width: row.metadata?.keyvalues?.width || 1280,
      height: row.metadata?.keyvalues?.height || 720,
    }));

    console.log("getImages: Processed images count:", images.length);
    return images;
  } catch (error) {
    console.error("getImages: Error fetching images:", error);
    if (error instanceof Error) {
      console.error("getImages: Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
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
