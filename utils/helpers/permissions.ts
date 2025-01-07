import type {
  GiftPermissions,
  CollaborativeGift,
} from "../types/collaborative";

/**
 * Check if a wallet address has permission to edit a gift
 */
export async function checkGiftPermissions(
  giftId: string,
  walletAddress: string
): Promise<GiftPermissions> {
  try {
    // TODO: Replace with actual API call to check permissions
    const response = await fetch(`/api/gifts/${giftId}/permissions`, {
      headers: {
        "wallet-address": walletAddress,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Gift not found");
      }
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to check permissions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking permissions:", error);
    // Default to no permissions on error
    return {
      canEdit: false,
      canInvite: false,
      canDelete: false,
    };
  }
}

/**
 * Check if a wallet address is the owner of a gift
 */
export function isGiftOwner(
  gift: CollaborativeGift,
  walletAddress: string
): boolean {
  return gift.owner.toLowerCase() === walletAddress.toLowerCase();
}

/**
 * Check if a wallet address is an editor of a gift
 */
export function isGiftEditor(
  gift: CollaborativeGift,
  walletAddress: string
): boolean {
  if (!gift.editors) return false;

  return gift.editors.some(
    (editor) =>
      editor.address.toLowerCase() === walletAddress.toLowerCase() &&
      editor.role === "editor"
  );
}

/**
 * Get the role of a wallet address for a gift
 */
export function getGiftRole(
  gift: CollaborativeGift,
  walletAddress: string
): "owner" | "editor" | null {
  if (isGiftOwner(gift, walletAddress)) return "owner";
  if (isGiftEditor(gift, walletAddress)) return "editor";
  return null;
}
