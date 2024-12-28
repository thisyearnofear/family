import fs from "fs";
import path from "path";
import axios from "axios";
import { FormData, Blob } from "formdata-node";

interface ImageMetadata {
  dateTaken?: string;
  description?: string;
  location?: string;
}

async function uploadImage(
  filePath: string,
  metadata: ImageMetadata,
  jwt: string
): Promise<void> {
  try {
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const formData = new FormData();

    // Create a metadata object with the provided data
    const pinataMetadata = {
      name: fileName,
      keyvalues: {
        dateTaken: metadata.dateTaken || new Date().toISOString(),
        description: metadata.description || "",
        location: metadata.location || "",
      },
    };

    // Add the file and metadata to the form
    formData.append("file", new Blob([fileData]), fileName);
    formData.append("pinataMetadata", JSON.stringify(pinataMetadata));

    // Upload to Pinata
    await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(`Successfully uploaded ${fileName}`);
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error);
    throw error;
  }
}

export async function uploadImages(
  directoryPath: string,
  metadata: Record<string, ImageMetadata>,
  jwt: string
): Promise<void> {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
      const filePath = path.join(directoryPath, file);
      await uploadImage(filePath, metadata[file] || {}, jwt);
    }
  }
}
