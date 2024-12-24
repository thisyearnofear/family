import fs from "fs";
import path from "path";
import { uploadToPinata } from "./pinata";

export async function uploadImagesFromDirectory(directoryPath: string) {
  try {
    const files = fs.readdirSync(directoryPath);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    for (const file of imageFiles) {
      const filePath = path.join(directoryPath, file);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${file}...`);
      const ipfsHash = await uploadToPinata(fileBuffer, file);
      console.log(`Uploaded ${file} - IPFS Hash: ${ipfsHash}`);
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}
