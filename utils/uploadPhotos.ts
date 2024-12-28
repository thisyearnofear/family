import { pinFileToIPFS, createGiftGroup, addFilesToGroup } from "./pinata";
import type { ImageProps } from "./types";

export interface UploadResult extends ImageProps {
  groupId: string;
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
      // Use file's lastModified date
      const dateTaken = new Date(file.lastModified).toISOString();

      // Upload to Pinata
      const { IpfsHash } = await pinFileToIPFS(file);
      cids.push(IpfsHash);

      results.push({
        id: results.length,
        ipfsHash: IpfsHash,
        name: file.name,
        dateTaken,
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
