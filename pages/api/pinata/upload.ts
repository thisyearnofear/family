import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

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
    let metadata;
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

    const options = {
      pinataMetadata: metadata,
    };

    console.log("📤 Uploading to Pinata with options:", options);
    const result = await pinata.pinFileToIPFS(readStream, options);
    console.log("✅ Upload successful:", { ipfsHash: result.IpfsHash });

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
