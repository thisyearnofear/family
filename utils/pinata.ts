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
}

interface PinResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToPinata(file: Buffer, fileName: string) {
  try {
    const formData = new FormData();
    formData.append("file", file, {
      filename: fileName,
      contentType: "image/jpeg",
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        maxContentLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}

export async function getImages(groupId?: string): Promise<IPFSImage[]> {
  try {
    if (groupId) {
      // Fetch the group JSON that contains our image list
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${groupId}`
      );

      // Map the images from our group JSON to IPFSImage format
      return response.data.images.map((image: any, index: number) => ({
        id: index,
        ipfsHash: image.ipfsHash,
        name: image.name || `Image ${index + 1}`,
        width: image.width || 1280,
        height: image.height || 720,
        dateTaken: image.dateTaken,
      }));
    } else {
      // Fallback to listing all files if no group ID provided
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
          })
        );
    }
  } catch (error) {
    console.error("Error fetching from Pinata:", error);
    return [];
  }
}
