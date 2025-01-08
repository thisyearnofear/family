import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;

if (!PINATA_JWT) {
  throw new Error("Missing Pinata JWT configuration");
}

const pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });

interface GiftMetadata {
  title?: string;
  theme?: string;
  giftId?: string;
  dateTaken?: string;
  messages?: string[];
  music?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    if (!files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const readStream = fs.createReadStream(file.filepath);

    // Parse metadata if provided
    let metadata: GiftMetadata = {};
    if (fields.metadata) {
      try {
        metadata = JSON.parse(
          Array.isArray(fields.metadata) ? fields.metadata[0] : fields.metadata
        );
        console.log("📄 Received metadata:", metadata);
      } catch (error) {
        console.error("❌ Error parsing metadata:", error);
        throw new Error("Invalid metadata format");
      }
    }

    // Create metadata object with proper typing
    const pinataOptions = {
      pinataMetadata: {
        name: file.originalFilename || "uploaded-file",
      },
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
    };

    // Add gift metadata as query params to be used when retrieving
    if (metadata.title) pinataOptions.pinataMetadata.name = metadata.title;
    if (metadata.theme)
      pinataOptions.pinataMetadata.name += `-${metadata.theme}`;
    if (metadata.giftId)
      pinataOptions.pinataMetadata.name += `-${metadata.giftId}`;

    console.log("📤 Uploading to Pinata with options:", pinataOptions);
    const result = await pinata.pinFileToIPFS(readStream, pinataOptions);
    console.log("✅ Upload successful:", { ipfsHash: result.IpfsHash });

    // Return both the IPFS hash and the full metadata for client-side use
    return res.status(200).json({
      success: true,
      ipfsHash: result.IpfsHash,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return res.status(500).json({
      message: "Error uploading file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
