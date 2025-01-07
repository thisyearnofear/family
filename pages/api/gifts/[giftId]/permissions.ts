import type { NextApiRequest, NextApiResponse } from "next";
import type { GiftPermissions } from "@utils/types/collaborative";
import { fetchGiftMetadata } from "@utils/api/pinata/metadata";
import { isGiftOwner, isGiftEditor } from "@utils/helpers/permissions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GiftPermissions | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { giftId } = req.query;
  const walletAddress = req.headers["wallet-address"];

  if (!giftId || typeof giftId !== "string") {
    return res.status(400).json({ error: "Missing gift ID" });
  }

  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "Missing wallet address" });
  }

  try {
    // Fetch gift metadata from Pinata
    const gift = await fetchGiftMetadata(giftId);

    if (!gift) {
      return res.status(404).json({ error: "Gift not found" });
    }

    // Check permissions based on wallet address
    const isOwner = isGiftOwner(gift, walletAddress);
    const isEditor = isGiftEditor(gift, walletAddress);

    // Set permissions based on role
    const permissions: GiftPermissions = {
      canEdit: isOwner || isEditor,
      canInvite: isOwner,
      canDelete: isOwner,
    };

    return res.status(200).json(permissions);
  } catch (error) {
    console.error("Error checking permissions:", error);
    return res.status(500).json({ error: "Failed to check permissions" });
  }
}
