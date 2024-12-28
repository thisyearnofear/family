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
      throw new Error("PINATA_JWT is not defined");
    }

    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues][groupId][value]=${groupId}&metadata[keyvalues][groupId][op]=eq`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      console.error("getImages: Pinata API error:", {
        status: response.status,
        statusText: response.statusText,
      });
      const errorText = await response.text();
      console.error("getImages: Error response:", errorText);
      throw new Error(
        `Pinata API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("getImages: Received rows count:", data.rows?.length);

    if (!data.rows) {
      console.error("getImages: No rows in response");
      return [];
    }

    const images = data.rows.map((row: any) => ({
      ipfsHash: row.ipfs_pin_hash,
      name: row.metadata.name,
      description: row.metadata.keyvalues.description,
      dateModified: row.date_pinned,
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
