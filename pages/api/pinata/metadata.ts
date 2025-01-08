import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

if (!PINATA_JWT) {
  throw new Error("Missing Pinata JWT configuration");
}

const pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });

interface GiftMetadata {
  title: string;
  theme: string;
  giftId: string;
  dateTaken?: string;
  messages: string[];
  music: string[];
  photos: string[]; // Array of IPFS hashes
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { cid } = req.query;

    if (!cid || typeof cid !== "string") {
      return res.status(400).json({ message: "Missing CID parameter" });
    }

    try {
      // Try to fetch metadata from Pinata gateway
      const response = await fetch(`${PINATA_GATEWAY}/${cid}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return res.status(200).json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return res.status(500).json({
        message: "Error fetching metadata",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const metadata: GiftMetadata = req.body;

      if (!metadata.title || !metadata.theme || !metadata.giftId) {
        return res
          .status(400)
          .json({ message: "Missing required metadata fields" });
      }

      // Create content object
      const pinataContent = {
        ...metadata,
        createdAt: new Date().toISOString(),
        version: "1.0",
      };

      // Create metadata object with keyvalues like the demos
      const pinataMetadata = {
        name: `${metadata.giftId}-metadata`,
        keyvalues: {
          type: "metadata",
          giftId: metadata.giftId,
        },
      };

      console.log("📤 Uploading metadata to Pinata:", {
        metadata: pinataMetadata,
        content: pinataContent,
      });

      // Cast the metadata to any to avoid TypeScript errors with keyvalues
      const result = await pinata.pinJSONToIPFS(pinataContent, {
        pinataMetadata: pinataMetadata as any,
        pinataOptions: {
          customPinPolicy: {
            regions: [
              {
                id: "FRA1",
                desiredReplicationCount: 1,
              },
              {
                id: "NYC1",
                desiredReplicationCount: 1,
              },
            ],
          },
        },
      });

      console.log("✅ Metadata upload successful:", {
        ipfsHash: result.IpfsHash,
      });

      return res.status(200).json({
        success: true,
        ipfsHash: result.IpfsHash,
      });
    } catch (error) {
      console.error("Error uploading metadata to Pinata:", error);
      return res.status(500).json({
        message: "Error uploading metadata",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
