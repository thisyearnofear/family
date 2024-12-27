import { customAlphabet } from "nanoid";
import type { ImageProps } from "./types";
import { deleteGiftGroup } from "./pinata";

// Create a URL-friendly ID generator (no special chars)
const generateId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export interface Gift {
  id: string;
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  password?: string;
  createdAt: string;
  groupId: string;
  viewed?: boolean;
}

// For MVP, we'll use localStorage to store gifts
// In production, this would be on a blockchain or database
export function createGift(
  gift: Omit<Gift, "id" | "createdAt" | "viewed">
): Gift {
  const id = generateId();
  const newGift: Gift = {
    ...gift,
    id,
    createdAt: new Date().toISOString(),
    viewed: false,
  };

  // Store in localStorage
  const gifts = getGifts();
  gifts.push(newGift);
  localStorage.setItem("gifts", JSON.stringify(gifts));

  return newGift;
}

export function getGift(id: string): Gift | undefined {
  const gifts = getGifts();
  const gift = gifts.find((gift) => gift.id === id);

  if (gift && !gift.viewed) {
    // Mark as viewed and update storage
    gift.viewed = true;
    localStorage.setItem("gifts", JSON.stringify(gifts));

    // Delete the Pinata group after viewing
    // This ensures one-time viewing
    deleteGiftGroup(gift.groupId).catch(console.error);
  }

  return gift;
}

export function validateGiftPassword(id: string, password: string): boolean {
  const gift = getGift(id);
  return gift?.password === password;
}

function getGifts(): Gift[] {
  try {
    const gifts = localStorage.getItem("gifts");
    return gifts ? JSON.parse(gifts) : [];
  } catch {
    return [];
  }
}

// TODO: Add blockchain integration for storing messages
// This would replace the localStorage implementation
// Example structure:
/*
interface BlockchainGift {
  id: string;
  messages: string[];
  ipfsGroupId: string;
  recipientAddress?: string;
  payment?: string;
}
*/
