import type { ImageProps } from "../../types/types";

let pinataGateway: string | null = null;
let pinataJwt: string | null = null;

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

// Function to get Pinata JWT
async function getPinataJwt() {
  if (!pinataJwt) {
    const response = await fetch("/api/pinata/jwt");
    if (!response.ok) {
      throw new Error("Failed to get Pinata JWT");
    }
    const { jwt } = await response.json();
    pinataJwt = jwt;
  }
  return pinataJwt;
}

/**
 * Creates a new gift by pinning metadata and images to IPFS
 */
export async function createGift(
  files: File[],
  theme: "space" | "japanese",
  messages: string[] = [],
  music: string[] = [],
  title?: string,
  customDates?: { [filename: string]: string },
  owner?: string,
  onProgress?: (status: {
    uploadedFiles: number;
    totalFiles: number;
    status: "uploading" | "verifying" | "pending" | "ready";
  }) => void
): Promise<{
  giftId: string;
  fileCount: number;
  status: "ready" | "pending";
  pendingCids?: string[];
}> {
  try {
    console.log("📦 Creating gift with:", {
      fileCount: files.length,
      theme,
      messageCount: messages.length,
      musicCount: music.length,
      title,
      customDates,
      owner,
    });

    // Get Pinata configuration
    const { gateway } = await getPinataConfig();

    // Generate a unique gift ID
    const giftId = `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    console.log("📦 Gift ID:", giftId);

    // Upload images to IPFS
    console.log("🖼️ Uploading images to IPFS...");
    let uploadedCount = 0;
    const uploadedImages = await Promise.all(
      files.map(async (file, index) => {
        try {
          console.log(
            `📤 Uploading image ${index + 1}/${files.length}: ${file.name}...`
          );

          // Create form data
          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "metadata",
            JSON.stringify({
              name: file.name,
              giftId,
              type: "image",
              index: index.toString(),
              dateTaken:
                customDates?.[file.name] ||
                new Date(file.lastModified).toISOString(),
            })
          );

          // Upload to API endpoint
          const response = await fetch("/api/pinata/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          uploadedCount++;
          onProgress?.({
            uploadedFiles: uploadedCount,
            totalFiles: files.length,
            status: "uploading",
          });

          console.log(
            `✅ Uploaded image ${index + 1}/${files.length}:`,
            file.name,
            result.ipfsHash
          );

          return {
            id: index + 1,
            name: file.name,
            description: `Photo taken on ${new Date(
              customDates?.[file.name] || file.lastModified
            ).toLocaleDateString()}`,
            ipfsHash: result.ipfsHash,
            dateTaken:
              customDates?.[file.name] ||
              new Date(file.lastModified).toISOString(),
            width: 1280, // Default width
            height: 720, // Default height
            url: `/api/pinata/image?cid=${result.ipfsHash}`,
          };
        } catch (error) {
          console.error(
            `❌ Failed to upload image ${index + 1}/${files.length}:`,
            file.name,
            error
          );
          throw error;
        }
      })
    );

    // Create and upload the gift metadata
    console.log("📄 Creating gift metadata...");
    onProgress?.({
      uploadedFiles: files.length,
      totalFiles: files.length,
      status: "verifying",
    });

    const giftData = {
      theme,
      title: title || "A Year in Memories",
      images: uploadedImages.map((img) => ({
        ...img,
        url: `/api/pinata/image?cid=${img.ipfsHash}`,
      })),
      messages: messages || [],
      music: music || [],
      createdAt: new Date().toISOString(),
      owner,
      editors: [],
      version: 1,
      lastModified: new Date().toISOString(),
      status: "published" as const,
    };

    console.log("📄 Creating gift metadata:", {
      theme,
      title: giftData.title,
      imageCount: giftData.images.length,
      messageCount: giftData.messages.length,
      musicCount: giftData.music.length,
    });

    console.log("📄 Uploading gift metadata to IPFS...");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(giftData)], { type: "application/json" })
    );

    // Ensure metadata keyvalues are properly set
    const metadataKeyvalues = {
      name: `${giftId}-metadata`,
      keyvalues: {
        giftId,
        type: "metadata",
        owner: owner || "",
        version: "1",
        status: "published",
        theme,
        title: giftData.title,
      },
    };

    console.log("📄 Setting metadata keyvalues:", metadataKeyvalues);
    formData.append("metadata", JSON.stringify(metadataKeyvalues));

    const metadataResponse = await fetch("/api/pinata/upload", {
      method: "POST",
      body: formData,
    });

    if (!metadataResponse.ok) {
      throw new Error(
        `Failed to upload metadata: ${metadataResponse.statusText}`
      );
    }

    const metadataUpload = await metadataResponse.json();
    const metadataCid = metadataUpload.IpfsHash;

    // Wait for files to be processed
    console.log("⏳ Waiting for files to be processed...");
    onProgress?.({
      uploadedFiles: files.length,
      totalFiles: files.length,
      status: "pending",
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Verify all files are properly pinned
    const allCids = [...uploadedImages.map((img) => img.ipfsHash), metadataCid];
    const verificationResult = await verifyGiftFiles(giftId, allCids);

    if (!verificationResult.isComplete) {
      console.warn(
        "⚠️ Some files are still processing:",
        verificationResult.missingCids
      );
      return {
        giftId,
        fileCount: files.length + 1,
        status: "pending",
        pendingCids: verificationResult.missingCids,
      };
    }

    onProgress?.({
      uploadedFiles: files.length,
      totalFiles: files.length,
      status: "ready",
    });

    console.log("🎁 Gift created successfully! Gift ID:", giftId);
    return {
      giftId,
      fileCount: files.length + 1,
      status: "ready",
    };
  } catch (error) {
    console.error("❌ Error creating gift:", error);
    throw error;
  }
}

/**
 * Verifies that all files for a gift are properly pinned
 */
async function verifyGiftFiles(giftId: string, expectedCids: string[]) {
  // Find all files for this gift
  const response = await fetch(`/api/pinata/list?giftId=${giftId}`);
  if (!response.ok) {
    throw new Error(`Failed to verify files: ${response.statusText}`);
  }

  const data = await response.json();
  const foundCids = data.rows.map((row: any) => row.ipfs_pin_hash);
  const missingCids = expectedCids.filter((cid) => !foundCids.includes(cid));

  return {
    isComplete: missingCids.length === 0,
    missingCids,
    foundCids,
  };
}

export interface GiftData {
  images: ImageProps[];
  theme: "space" | "japanese";
  messages?: string[];
  music?: string[];
  title?: string;
}

export async function getImages({
  groupId,
  hasFiles = true,
  hasIpfs = false,
  isDemo = false,
}: {
  groupId: string;
  hasFiles?: boolean;
  hasIpfs?: boolean;
  isDemo?: boolean;
}): Promise<GiftData> {
  try {
    console.log("🎁 Unwrapping gift:", { groupId });

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

    console.log("✅ Found metadata file:", {
      name: metadataFile.metadata?.name,
      keyvalues: metadataFile.metadata?.keyvalues,
      hash: metadataFile.ipfs_pin_hash,
    });

    // Fetch metadata content using our API endpoint
    console.log("📄 Fetching metadata:", metadataFile.ipfs_pin_hash);
    const metadata = await getMetadata(metadataFile.ipfs_pin_hash);

    console.log("📦 Raw metadata:", JSON.stringify(metadata, null, 2));
    console.log("📝 Messages from metadata:", metadata.messages);

    console.log("📦 Retrieved gift data:", {
      theme: metadata.theme,
      imageCount: metadata.images?.length,
      messageCount: metadata.messages?.length,
      musicCount: metadata.music?.length,
      messages: metadata.messages,
      title: metadata.title,
    });

    // Ensure all image URLs use the current gateway
    metadata.images = metadata.images.map((img: ImageProps) => ({
      ...img,
      url: `/api/pinata/image?cid=${img.ipfsHash}`,
    }));

    return {
      images: metadata.images.map((img: ImageProps) => ({
        ...img,
        url: `/api/pinata/image?cid=${img.ipfsHash}`,
      })),
      theme: metadata.theme || "space",
      messages: metadata.messages || [],
      music: metadata.music || [],
      title: metadata.title || "A Year in Memories",
    };
  } catch (error) {
    console.error("❌ Error getting images:", error);
    throw error;
  }
}

/**
 * Extracts metadata from a file
 */
export async function extractFileMetadata(
  file: File
): Promise<{ dateTaken?: string; name: string }> {
  // Try to get date from filename first (format: YYYY-MM-DD-*.*)
  const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return {
      dateTaken: new Date(dateMatch[1]).toISOString(),
      name: file.name,
    };
  }

  return {
    dateTaken: new Date(file.lastModified).toISOString(),
    name: file.name,
  };
}

export const getMetadata = async (cid: string) => {
  try {
    const response = await fetch(`/api/pinata/metadata?cid=${cid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error fetching metadata:", error);
    throw error;
  }
};
