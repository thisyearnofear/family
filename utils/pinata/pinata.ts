import { PinataSDK } from "pinata-web3";
import axios from "axios";
import FormData from "form-data";

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

export async function getImages(groupId?: string): Promise<IPFSImage[]> {
  try {
    if (groupId) {
      // Fetch the group JSON that contains our image list
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/${groupId}`
      );

      // Map the images from our group JSON to IPFSImage format
      return response.data.images.map((image: any, index: number) => ({
        id: index,
        ipfsHash: image.ipfsHash,
        name: image.name || `Image ${index + 1}`,
        width: image.width || 1280,
        height: image.height || 720,
        dateTaken: image.dateTaken,
        dateModified:
          image.dateModified || image.dateTaken || new Date().toISOString(), // Ensure we always have a date
      }));
    } else {
      // List all files in the account
      const response = await axios.get(
        "https://api.pinata.cloud/data/pinList",
        {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        }
      );

      return response.data.rows
        .filter((pin: any) => {
          const name = pin.metadata?.name;
          return (
            typeof name === "string" && /\.(jpg|jpeg|png|gif)$/i.test(name)
          );
        })
        .map(
          (pin: any, index: number): IPFSImage => ({
            id: index,
            ipfsHash: pin.ipfs_pin_hash,
            name: pin.metadata?.name ?? `Image ${index}`,
            width: 1280,
            height: 720,
            dateModified:
              pin.metadata?.dateModified ||
              pin.date_pinned ||
              new Date().toISOString(),
          })
        );
    }
  } catch (error) {
    console.error("Error fetching from Pinata:", error);
    return [];
  }
}

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
