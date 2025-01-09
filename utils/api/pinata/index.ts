import type { ImageProps } from "../../types/types";

let pinataGateway: string | null = null;

// Function to get Pinata configuration
async function getPinataConfig() {
  if (!pinataGateway) {
    const response = await fetch("/api/pinata/config");
    if (!response.ok) {
      throw new Error("Failed to get Pinata configuration");
    }
    const config = await response.json();
    pinataGateway = config.gateway;
  }
  return { gateway: pinataGateway };
}

// Function to get metadata from IPFS
export async function getMetadata(cid: string) {
  try {
    const response = await fetch(`/api/pinata/metadata?cid=${cid}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching metadata:", error);
    throw error;
  }
}

interface PinataFile {
  name: string;
  metadata?: {
    keyvalues?: {
      theme?: string;
      [key: string]: any;
    };
  };
}

interface GetImagesParams {
  groupId: string;
  hasFiles?: boolean;
  hasIpfs?: boolean;
  isDemo?: boolean;
  metadataOnly?: boolean;
}

interface ImageMetadata {
  ipfsHash: string;
  description: string;
  dateTaken: string;
  width: number;
  height: number;
}

export async function getImages({
  groupId,
  hasFiles = true,
  hasIpfs = false,
  isDemo = false,
  metadataOnly = false,
}: GetImagesParams) {
  console.log("🎁 Checking gift:", { groupId, metadataOnly });

  try {
    // If metadataOnly is true, just check if the gift exists
    if (metadataOnly) {
      const response = await fetch(`/api/pinata/list?giftId=${groupId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch gift files");
      }

      const { rows } = await response.json();
      console.log("📂 Found files for validation:", rows);

      const metadataFile = rows.find((file: any) => {
        const keyvalues = file.metadata?.keyvalues;
        return keyvalues?.type === "metadata" && keyvalues?.giftId === groupId;
      });

      if (!metadataFile) {
        throw new Error("Gift not found");
      }

      return { theme: metadataFile.metadata?.keyvalues?.theme || "japanese" };
    }

    // Get Pinata configuration
    const { gateway } = await getPinataConfig();

    // Find all files for this gift
    console.log("📂 Fetching gift files...");
    const response = await fetch(`/api/pinata/list?giftId=${groupId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch gift files: ${response.statusText}`);
    }

    const giftFiles = await response.json();
    console.log(
      "📂 Found files:",
      giftFiles.rows.map((f: any) => ({
        name: f.metadata?.name,
        keyvalues: f.metadata?.keyvalues,
        hash: f.ipfs_pin_hash,
      }))
    );

    // Find metadata file
    const metadataFile = giftFiles.rows.find((file: any) => {
      const keyvalues = file.metadata?.keyvalues;
      console.log("🔍 Checking file metadata:", {
        name: file.metadata?.name,
        keyvalues,
        hash: file.ipfs_pin_hash,
      });
      return keyvalues?.type === "metadata" && keyvalues?.giftId === groupId;
    });

    if (!metadataFile) {
      console.error(
        "❌ No metadata file found. Files available:",
        giftFiles.rows
      );
      throw new Error(
        "Gift metadata not found. Please try again in a few moments."
      );
    }

    // Use keyvalues from metadata file if available
    const keyvalues = metadataFile.metadata?.keyvalues || {};
    console.log("✅ Found metadata keyvalues:", keyvalues);

    // Fetch metadata content using our API endpoint
    console.log("📄 Fetching metadata:", metadataFile.ipfs_pin_hash);
    const metadata = await getMetadata(metadataFile.ipfs_pin_hash);

    console.log("📦 Raw metadata:", JSON.stringify(metadata, null, 2));
    console.log("📝 Messages from metadata:", metadata.messages);

    console.log("📦 Retrieved gift data:", {
      theme: metadata.theme,
      imageCount: metadata.photos?.length || metadata.images?.length,
      messageCount: metadata.messages?.length,
      musicCount: metadata.music?.length,
      messages: metadata.messages,
      title: keyvalues.title || metadata.title,
      music: keyvalues.music ? JSON.parse(keyvalues.music) : metadata.music,
    });

    // Handle both simple IPFS hash arrays and full image metadata objects
    const images = metadata.photos
      ? metadata.photos.map((ipfsHash: string) => ({
          ipfsHash,
          url: `/api/pinata/image?cid=${ipfsHash}`,
          description: `Photo from ${keyvalues.title || metadata.title || "gift"}`,
          dateTaken: metadata.dateTaken || metadata.createdAt,
          width: 1280, // Default dimensions
          height: 720,
        }))
      : metadata.images?.map((image: ImageMetadata) => ({
          ipfsHash: image.ipfsHash,
          url: `/api/pinata/image?cid=${image.ipfsHash}`,
          description: image.description,
          dateTaken: image.dateTaken,
          width: image.width,
          height: image.height,
        })) || [];

    return {
      images,
      theme: keyvalues.theme || metadata.theme || "space",
      messages: metadata.messages || [],
      music: keyvalues.music
        ? JSON.parse(keyvalues.music)
        : metadata.music || [],
      title: keyvalues.title || metadata.title || "A Year in Memories",
    };
  } catch (error) {
    console.error("❌ Error getting images:", error);
    throw error;
  }
}
