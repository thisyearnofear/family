import { NextApiRequest, NextApiResponse } from "next";
import PinataSDK from "@pinata/sdk";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.error("❌ Missing Pinata JWT configuration");
}

const pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { giftId } = req.query;

  if (!giftId || typeof giftId !== "string") {
    return res.status(400).json({ message: "Missing giftId parameter" });
  }

  try {
    console.log(`🗑️ Deleting gift: ${giftId}`);

    // Find all files associated with this gift
    const giftFiles = await pinata.pinList({
      metadata: {
        keyvalues: {
          giftId: {
            value: giftId,
            op: "eq",
          },
        },
      },
    });

    console.log(`📦 Found ${giftFiles.rows.length} files to delete`);

    // Unpin all files
    await Promise.all(
      giftFiles.rows.map(async (file) => {
        try {
          await pinata.unpin(file.ipfs_pin_hash);
          console.log(`✅ Unpinned: ${file.ipfs_pin_hash}`);
        } catch (error) {
          console.error(`❌ Failed to unpin ${file.ipfs_pin_hash}:`, error);
          // Continue with other files even if one fails
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: `Successfully deleted gift ${giftId}`,
      deletedFiles: giftFiles.rows.length,
    });
  } catch (error) {
    console.error("Error deleting gift:", error);
    return res.status(500).json({
      message: "Error deleting gift",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
