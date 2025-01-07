import type { NextApiRequest, NextApiResponse } from "next";
import type { CollaborativeGift } from "@utils/types/collaborative";
import { checkGiftPermissions } from "@utils/helpers/permissions";
import { fetchGiftMetadata } from "@utils/api/pinata/metadata";
import { updateGiftMetadata } from "@utils/api/pinata/metadata";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CollaborativeGift | { error: string }>
) {
  const { giftId } = req.query;
  const walletAddress = req.headers["wallet-address"];

  if (!giftId || typeof giftId !== "string") {
    return res.status(400).json({ error: "Missing gift ID" });
  }

  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "Missing wallet address" });
  }

  try {
    // Check permissions first
    const permissions = await checkGiftPermissions(giftId, walletAddress);
    if (!permissions.canEdit) {
      return res
        .status(403)
        .json({ error: "You don't have permission to edit this gift" });
    }

    switch (req.method) {
      case "GET":
        const gift = await fetchGiftMetadata(giftId);
        if (!gift) {
          return res.status(404).json({ error: "Gift not found" });
        }
        return res.status(200).json(gift);

      case "PUT":
        const updates = req.body;
        if (!updates) {
          return res.status(400).json({ error: "Missing update data" });
        }

        // Fetch current gift data
        const currentGift = await fetchGiftMetadata(giftId);
        if (!currentGift) {
          return res.status(404).json({ error: "Gift not found" });
        }

        // Verify version to prevent conflicts
        if (updates.version && updates.version <= currentGift.version) {
          return res
            .status(409)
            .json({ error: "Gift has been modified by another user" });
        }

        // Update gift metadata
        const updatedGift = await updateGiftMetadata(giftId, {
          ...currentGift,
          ...updates,
          version: currentGift.version + 1,
          lastModified: new Date().toISOString(),
        });

        return res.status(200).json(updatedGift);

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling gift request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
