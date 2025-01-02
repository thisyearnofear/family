import { PinataSDK as PinataIPFS } from "pinata-web3";
import { PinataSDK as PinataFiles, type FileListResponse } from "pinata";
import type {
  ImageProps,
  PinataResponse,
  PinJSONOptions,
  PinataListResponse,
  UploadResult,
} from "../../types/types";

const PINATA_JWT = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

// Initialize SDKs with error handling
function initializePinataSDKs() {
  if (!PINATA_JWT || !PINATA_GATEWAY) {
    console.error("Pinata Configuration Missing:", {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NETLIFY_ENV: process.env.NETLIFY_ENV,
      NETLIFY: process.env.NETLIFY,
      PINATA_JWT: !!PINATA_JWT, // Log only boolean for security
      PINATA_GROUP_ID: process.env.PINATA_GROUP_ID,
      NEXT_PUBLIC_PINATA_GATEWAY: PINATA_GATEWAY,
    });
    return null;
  }

  try {
    // Initialize IPFS SDK for public content
    const ipfs = new PinataIPFS({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    // Initialize Files SDK for private content
    const files = new PinataFiles({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    return { ipfs, files };
  } catch (error) {
    console.error("Failed to initialize Pinata SDKs:", error);
    return null;
  }
}

const pinata = initializePinataSDKs();

/**
 * Creates a new private group for organizing user photos
 */
export async function createGroup(name: string, description?: string) {
  if (!pinata?.files) {
    throw new Error("Pinata Files SDK not initialized");
  }

  try {
    const group = await pinata.files.groups.create({
      name,
      isPublic: false,
    });
    return group;
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error("Failed to create group");
  }
}

/**
 * Uploads multiple photos to Pinata Files API (private)
 */
export async function uploadPhotos(
  files: File[],
  groupId: string
): Promise<UploadResult[]> {
  if (!pinata?.files) {
    throw new Error("Pinata Files SDK not initialized");
  }

  const uploadedPhotos: UploadResult[] = [];

  // Process files in parallel with a concurrency limit
  const batchSize = 3;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const uploadPromises = batch.map(async (file) => {
      try {
        // Extract metadata from file
        const metadata = await extractFileMetadata(file);

        // Upload file
        const upload = await pinata.files.upload.file(file);

        // Add to group
        await pinata.files.groups.addFiles({
          groupId,
          files: [upload.id],
        });

        return {
          id: uploadedPhotos.length,
          ipfsHash: upload.cid,
          name: metadata.name,
          description: null,
          dateTaken: metadata.dateTaken || new Date().toISOString(),
          dateModified: new Date().toISOString(),
          width: 1280, // Default width
          height: 720, // Default height
          groupId,
        };
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    });

    const results = await Promise.all(uploadPromises);
    uploadedPhotos.push(...results);
  }

  return uploadedPhotos;
}

/**
 * Extracts metadata from a file
 */
async function extractFileMetadata(
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

  // Try to get EXIF data if it's a JPEG
  if (file.type === "image/jpeg") {
    try {
      // Here we would use EXIF reader library
      // For now, just use the file's last modified date
      return {
        dateTaken: new Date(file.lastModified).toISOString(),
        name: file.name,
      };
    } catch (error) {
      console.warn("Failed to read EXIF data:", error);
    }
  }

  return {
    dateTaken: new Date(file.lastModified).toISOString(),
    name: file.name,
  };
}

/**
 * Retrieves images by group ID from Pinata
 * If isDemo is true, uses IPFS API for public content
 */
export async function getImages(
  groupId: string,
  isDemo = false
): Promise<ImageProps[]> {
  if (!pinata) {
    console.error("Pinata SDKs not initialized");
    return [];
  }

  try {
    if (isDemo) {
      if (!pinata.ipfs) {
        throw new Error("Pinata IPFS SDK not initialized");
      }

      // For demo content, use IPFS API
      const response = await pinata.ipfs.groups.get({ groupId });
      if (!response) {
        throw new Error(`Group not found: ${groupId}`);
      }

      const files = Array.isArray(response) ? response : [response];
      return files.map((file: any, index: number) => ({
        id: index,
        ipfsHash: file.IpfsHash,
        name: file.name || `Image ${index + 1}`,
        description: null,
        dateTaken: file.metadata?.keyValues?.dateTaken || file.createdAt,
        dateModified: file.updatedAt,
        width: 1280,
        height: 720,
        groupId,
      }));
    } else {
      if (!pinata.files) {
        throw new Error("Pinata Files SDK not initialized");
      }

      // For user content, use Files API
      const group = await pinata.files.groups.get({ groupId });
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }

      // Get files in the group
      const response = await pinata.files.files.list();
      const groupFiles = response.files.filter(
        (file) => file.group_id === groupId
      );

      return groupFiles.map((file, index) => ({
        id: index,
        ipfsHash: file.cid,
        name: file.name || `Image ${index + 1}`,
        description: null,
        dateTaken: file.created_at,
        dateModified: file.created_at,
        width: 1280,
        height: 720,
        groupId: file.group_id || groupId,
      }));
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

/**
 * Updates the date taken for multiple photos (private content only)
 */
export async function updatePhotosDates(
  photos: { ipfsHash: string; dateTaken: string }[]
): Promise<void> {
  if (!pinata?.files) {
    throw new Error("Pinata Files SDK not initialized");
  }

  try {
    for (const photo of photos) {
      await pinata.files.files.update({
        id: photo.ipfsHash,
        name: photo.ipfsHash, // Keep the same name
        keyvalues: {
          dateTaken: photo.dateTaken,
        },
      });
    }
  } catch (error) {
    console.error("Error updating photo dates:", error);
    throw new Error("Failed to update photo dates");
  }
}

/**
 * Pins a JSON object to IPFS (public content)
 */
export async function pinJSONToIPFS(
  jsonData: any,
  options?: PinJSONOptions
): Promise<PinataResponse> {
  if (!pinata?.ipfs) {
    throw new Error("Pinata IPFS SDK not initialized");
  }

  try {
    const upload = await pinata.ipfs.upload.json(jsonData, {
      metadata: options?.pinataMetadata,
    });

    return {
      IpfsHash: upload.IpfsHash,
      PinSize: 0, // Size information not available in new SDK
      Timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error pinning JSON to IPFS:", error);
    throw new Error("Failed to pin JSON to IPFS");
  }
}

/**
 * Retrieves a JSON object from IPFS (public content)
 */
export async function getJSONFromIPFS(ipfsHash: string): Promise<any> {
  if (!pinata?.ipfs) {
    throw new Error("Pinata IPFS SDK not initialized");
  }

  try {
    const data = await pinata.ipfs.gateways.get(ipfsHash);
    return data;
  } catch (error) {
    console.error("Error fetching JSON from IPFS:", error);
    throw new Error("Failed to fetch JSON from IPFS");
  }
}
