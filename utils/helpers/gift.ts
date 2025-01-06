import type { ImageProps } from "../types/types";

interface GiftData {
  theme: "space" | "japanese";
  messages: string[];
  photos: ImageProps[];
  giftId: string;
  title?: string;
}

/**
 * Creates gift data object from component state
 */
export function createGiftData(
  giftId: string,
  theme: "space" | "japanese",
  messages: string[],
  photos: { file: File; preview: string; dateTaken: string }[],
  title?: string
): GiftData {
  return {
    theme,
    messages,
    photos: photos.map((p, index) => ({
      id: index + 1,
      url: p.preview,
      dateTaken: p.dateTaken,
      width: 800,
      height: 600,
      ipfsHash: "",
      name: p.file.name,
      description: `Photo taken on ${new Date(
        p.dateTaken
      ).toLocaleDateString()}`,
    })),
    giftId,
    title,
  };
}

/**
 * Downloads gift ID information as a text file
 */
export function downloadGiftInfo(giftId: string, theme: "space" | "japanese") {
  const giftInfo = `FamilyWrapped Gift ID

Your Gift ID: ${giftId}

Important:
• Keep this ID safe - you'll need it to share your gift
• Your photos are stored privately and securely
• Only people with this ID can view your gift
• The gift will be shown in ${theme} theme

Created on: ${new Date().toLocaleString()}`;

  const blob = new Blob([giftInfo], { type: "text/plain" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `familywrapped-gift-${giftId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Attempts to copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!document.hasFocus()) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Could not copy to clipboard:", error);
    return false;
  }
}
