import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

if (!PINATA_JWT) {
  console.error("❌ Missing Pinata JWT configuration");
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
      // Try different gateways if one fails
      const gateways = [
        `${PINATA_GATEWAY}/ipfs`,
        "https://ipfs.io/ipfs",
        "https://cloudflare-ipfs.com/ipfs",
      ];

      let lastError;
      for (const gateway of gateways) {
        try {
          console.log(`🌐 Trying gateway: ${gateway} for CID: ${cid}`);
          const response = await fetch(`${gateway}/${cid}`);

          if (!response.ok) {
            if (response.status === 429) {
              console.log(
                `⚠️ Rate limited on ${gateway}, trying next gateway...`
              );
              continue;
            }
            const errorText = await response.text();
            console.error(`❌ Gateway ${gateway} error:`, {
              status: response.status,
              statusText: response.statusText,
              body: errorText,
            });
            throw new Error(
              `HTTP error! status: ${response.status} - ${errorText}`
            );
          }

          const metadata = await response.json();
          console.log("✅ Successfully fetched metadata from", gateway);
          return res.status(200).json(metadata);
        } catch (error) {
          console.error(`❌ Failed to fetch from ${gateway}:`, error);
          lastError = error;
        }
      }

      console.error("❌ All gateways failed:", lastError);
      throw (
        lastError || new Error("Failed to fetch metadata from all gateways")
      );
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
