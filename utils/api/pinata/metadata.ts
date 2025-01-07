import type { CollaborativeGift } from "../../types/collaborative";

interface PinataMetadataResponse {
  rows: Array<{
    ipfs_pin_hash: string;
    metadata: {
      name: string;
      keyvalues: {
        type?: string;
        owner?: string;
        editors?: string;
        version?: string;
      };
    };
  }>;
}

/**
 * Fetch gift metadata from Pinata
 */
export async function fetchGiftMetadata(
  giftId: string
): Promise<CollaborativeGift | null> {
  try {
    // Get Pinata JWT from our API
    const jwtResponse = await fetch("/api/pinata/jwt");
    if (!jwtResponse.ok) {
      throw new Error("Failed to get Pinata JWT");
    }
    const { jwt } = await jwtResponse.json();

    // Search for metadata file in Pinata
    const searchResponse = await fetch(
      `https://api.pinata.cloud/data/pinList?metadata[keyvalues][giftId][value]=${giftId}&metadata[keyvalues][type][value]=metadata`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error("Failed to search Pinata");
    }

    const data: PinataMetadataResponse = await searchResponse.json();
    const metadataFile = data.rows[0];

    if (!metadataFile) {
      return null;
    }

    // Fetch the actual metadata content
    const metadataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${metadataFile.ipfs_pin_hash}`
    );

    if (!metadataResponse.ok) {
      throw new Error("Failed to fetch metadata content");
    }

    const metadata = await metadataResponse.json();

    // Convert metadata to CollaborativeGift format
    return {
      ...metadata,
      owner: metadata.owner || metadataFile.metadata.keyvalues.owner || "",
      editors: metadata.editors || [],
      pendingInvites: metadata.pendingInvites || [],
      version: parseInt(metadataFile.metadata.keyvalues.version || "1"),
      lastModified: metadata.lastModified || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching gift metadata:", error);
    return null;
  }
}

/**
 * Update gift metadata in Pinata
 */
export async function updateGiftMetadata(
  giftId: string,
  updatedGift: CollaborativeGift
): Promise<CollaborativeGift> {
  try {
    // Get Pinata JWT from our API
    const jwtResponse = await fetch("/api/pinata/jwt");
    if (!jwtResponse.ok) {
      throw new Error("Failed to get Pinata JWT");
    }
    const { jwt } = await jwtResponse.json();

    // Search for existing metadata file
    const searchResponse = await fetch(
      `https://api.pinata.cloud/data/pinList?metadata[keyvalues][giftId][value]=${giftId}&metadata[keyvalues][type][value]=metadata`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error("Failed to search Pinata");
    }

    const data: PinataMetadataResponse = await searchResponse.json();
    const existingMetadata = data.rows[0];

    if (!existingMetadata) {
      throw new Error("Gift metadata not found");
    }

    // Prepare metadata for update
    const metadata = {
      name: `Gift ${giftId} Metadata`,
      keyvalues: {
        giftId,
        type: "metadata",
        owner: updatedGift.owner,
        editors: JSON.stringify(updatedGift.editors || []),
        version: updatedGift.version.toString(),
      },
    };

    // Upload updated metadata to IPFS
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(updatedGift)], { type: "application/json" })
    );
    formData.append("pinataMetadata", JSON.stringify(metadata));

    const uploadResponse = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload updated metadata");
    }

    const { IpfsHash: newHash } = await uploadResponse.json();

    // Unpin old metadata
    await fetch(
      `https://api.pinata.cloud/pinning/unpin/${existingMetadata.ipfs_pin_hash}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    return updatedGift;
  } catch (error) {
    console.error("Error updating gift metadata:", error);
    throw error;
  }
}
