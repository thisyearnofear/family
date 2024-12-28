import { pinFileToIPFS, createGiftGroup, addFilesToGroup } from "./pinata";
import type { ImageProps } from "../types/types";

export interface UploadResult extends ImageProps {
  groupId: string;
}

export function extractDateFromFileName(fileName: string): string | null {
  // Match patterns like "2024-03-15" or "20240315" at the start of filename
  const datePattern = /^(\d{4}[-_]?\d{2}[-_]?\d{2})/;
  const match = fileName.match(datePattern);
  if (match) {
    // Convert to standard format
    const dateStr = match[1].replace(/[-_]/g, "");
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(
      6,
      8
    )}`;
  }
  return null;
}

export async function uploadPhotos(
  files: File[],
  giftId: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const cids: string[] = [];

  // Create a Pinata group for this gift
  const { id: groupId } = await createGiftGroup(giftId);

  // Sort files by lastModified date
  const sortedFiles = [...files].sort(
    (a, b) => a.lastModified - b.lastModified
  );

  for (const file of sortedFiles) {
    try {
      // Try to get the date in this order:
      // 1. File's lastModified date
      // 2. Date from filename
      // 3. Current date as fallback
      let dateModified = new Date(file.lastModified).toISOString();
      const dateFromName = extractDateFromFileName(file.name);
      if (!dateModified && dateFromName) {
        dateModified = new Date(dateFromName).toISOString();
      }
      if (!dateModified) {
        dateModified = new Date().toISOString();
      }

      // Upload to Pinata
      const { IpfsHash } = await pinFileToIPFS(file);
      cids.push(IpfsHash);

      results.push({
        id: results.length,
        ipfsHash: IpfsHash,
        name: file.name,
        dateModified,
        width: 1280, // Default width
        height: 720, // Default height
        groupId,
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    }
  }

  // Add all files to the group
  await addFilesToGroup(groupId, cids);

  return results;
}

// Function to validate and process a batch of photos before upload
export function validatePhotos(files: File[]): {
  valid: File[];
  invalid: { file: File; reason: string }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  for (const file of files) {
    // Check file type
    if (!file.type.startsWith("image/")) {
      invalid.push({ file, reason: "Not an image file" });
      continue;
    }

    // Check file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      invalid.push({ file, reason: "File too large (max 10MB)" });
      continue;
    }

    valid.push(file);
  }

  return { valid, invalid };
}
