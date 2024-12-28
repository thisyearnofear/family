import fs from "fs";
import path from "path";
import exifReader from "exif-reader";
import axios from "axios";
import { FormData, Blob } from "formdata-node";

export interface ImageMetadata {
  ipfsHash: string;
  name: string;
  dateTaken?: string;
  width?: number;
  height?: number;
}

interface ExifData {
  exif?: {
    DateTimeOriginal?: string;
  };
  image?: {
    ModifyDate?: string;
  };
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

export async function uploadToPinata(fileBuffer: Buffer, fileName: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), fileName);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        maxContentLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}

export async function uploadImagesFromDirectory(directoryPath: string): Promise<ImageMetadata[]> {
  try {
    const files = fs.readdirSync(directoryPath);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    const uploadedImages: ImageMetadata[] = [];

    for (const file of imageFiles) {
      const filePath = path.join(directoryPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);

      console.log(`\nProcessing ${file}...`);

      // Get the file's modification date first and use it directly
      const dateTaken = stats.mtime.toISOString().split("T")[0];
      console.log(`Using file's modification date: ${dateTaken}`);

      console.log(`Uploading ${file}...`);
      const ipfsHash = await uploadToPinata(fileBuffer, file);
      console.log(`Uploaded ${file} - IPFS Hash: ${ipfsHash}`);

      uploadedImages.push({
        ipfsHash,
        name: file,
        dateTaken,
        width: undefined,
        height: undefined,
      });
    }

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

export async function testImageDates(directoryPath: string): Promise<void> {
  try {
    console.log(`Reading directory: ${directoryPath}`);
    const files = fs.readdirSync(directoryPath);

    console.log(`Found ${files.length} files`);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    console.log(`Found ${imageFiles.length} image files`);

    if (imageFiles.length === 0) {
      console.log("No image files found in the directory");
      return;
    }

    console.log("\nTesting date extraction for images...\n");

    for (const file of imageFiles) {
      const filePath = path.join(directoryPath, file);
      console.log(`\nProcessing: ${file}`);
      console.log("----------------------------------------");

      try {
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`File size: ${fileBuffer.length} bytes`);

        const stats = fs.statSync(filePath);

        // 1. File system dates (now first!)
        console.log("\nFile system dates (primary source):");
        console.log("Modified:", stats.mtime.toISOString());
        console.log("Created:", stats.birthtime.toISOString());
        console.log("Last accessed:", stats.atime.toISOString());

        // 2. Try filename (backup)
        console.log("\nChecking filename for date (backup):");
        const dateFromName = extractDateFromFileName(file);
        if (dateFromName) {
          console.log("Date from filename:", dateFromName);
        } else {
          console.log("No date found in filename");
        }

        // 3. Try EXIF data (last resort)
        console.log("\nAttempting to read EXIF data (last resort):");
        try {
          let metadata: ExifData | null = null;
          try {
            metadata = exifReader(fileBuffer) as ExifData;
            console.log("Successfully read EXIF data from start of buffer");
          } catch (e) {
            try {
              metadata = exifReader(fileBuffer.slice(12)) as ExifData;
              console.log("Successfully read EXIF data from offset 12");
            } catch (e2) {
              console.log("Failed to read EXIF data:", e2 instanceof Error ? e2.message : String(e2));
              metadata = null;
            }
          }

          if (metadata?.exif?.DateTimeOriginal) {
            console.log("EXIF Original Date:", metadata.exif.DateTimeOriginal);
          }
          if (metadata?.image?.ModifyDate) {
            console.log("EXIF Modify Date:", metadata.image.ModifyDate);
          }
          if (
            !metadata?.exif?.DateTimeOriginal &&
            !metadata?.image?.ModifyDate
          ) {
            console.log("No date information found in EXIF data");
          }
        } catch (e) {
          console.log("Error reading EXIF data:", e instanceof Error ? e.message : String(e));
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error("Error testing images:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
