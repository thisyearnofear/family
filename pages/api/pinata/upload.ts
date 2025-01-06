import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";
import formidable from "formidable";
import fs from "fs";

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

if (!PINATA_JWT || !PINATA_GATEWAY) {
  throw new Error("Missing Pinata configuration");
}

// Initialize Pinata client
const pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    if (!files.file || !files.file[0]) {
      return res.status(400).json({ error: "No file provided" });
    }

    const file = files.file[0];
    const metadata = fields.pinataMetadata?.[0];

    // Create readable stream from file
    const readStream = fs.createReadStream(file.filepath);

    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(readStream, {
      pinataMetadata: metadata ? JSON.parse(metadata) : undefined,
    });

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return res.status(500).json({ error: "Failed to upload file" });
  }
}
