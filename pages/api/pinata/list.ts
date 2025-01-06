import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";

const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  throw new Error("Missing Pinata configuration");
}

// Initialize Pinata client
const pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { giftId } = req.query;

    if (!giftId || typeof giftId !== "string") {
      return res.status(400).json({ error: "Gift ID is required" });
    }

    const response = await pinata.pinList({
      metadata: {
        keyvalues: {
          giftId: {
            value: giftId,
            op: "eq",
          },
        },
      },
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error listing Pinata files:", error);
    return res.status(500).json({ error: "Failed to list files" });
  }
}
