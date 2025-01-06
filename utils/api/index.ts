import { getMetadata } from "./pinata";

interface GiftData {
  images: string[];
  messages?: string[];
  music?: string[];
  theme?: string;
  title?: string;
}

const getMetadataCid = async (groupId: string): Promise<string | null> => {
  // For now, just return the groupId as the CID
  // This should be replaced with actual metadata CID lookup
  return groupId;
};

export const getImages = async (groupId: string): Promise<GiftData> => {
  console.log("🎁 Unwrapping gift:", { groupId, isDemo: false });

  try {
    console.log("📂 Fetching gift files...");

    // Get metadata CID from local storage or API
    const metadataCid = await getMetadataCid(groupId);
    if (!metadataCid) {
      throw new Error("No metadata CID found for gift");
    }

    console.log("📄 Fetching metadata:", metadataCid);
    const metadata = await getMetadata(metadataCid);

    if (!metadata || !metadata.images) {
      throw new Error("Invalid metadata format");
    }

    return {
      images: metadata.images,
      messages: metadata.messages || [],
      music: metadata.music || [],
      theme: metadata.theme || "space",
      title: metadata.title,
    };
  } catch (error) {
    console.error("❌ Error getting images:", error);
    throw error;
  }
};
