import { uploadPhotos, validatePhotos } from "../utils/pinata/uploadPhotos";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

async function main() {
  const directoryPath = process.argv[2];
  if (!directoryPath) {
    console.error("Please provide a directory path");
    process.exit(1);
  }

  try {
    // Create a unique gift ID
    const giftId = uuidv4();

    // Convert directory files to File objects
    const files = fs
      .readdirSync(directoryPath)
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map((file) => {
        const filePath = path.join(directoryPath, file);
        const buffer = fs.readFileSync(filePath);
        return new File([buffer], file, {
          type: `image/${path.extname(file).slice(1)}`,
          lastModified: fs.statSync(filePath).mtimeMs,
        });
      });

    console.log(`Found ${files.length} image files`);

    // Validate files
    const { valid, invalid } = validatePhotos(files);

    if (invalid.length > 0) {
      console.log("\nSkipping invalid files:");
      invalid.forEach(({ file, reason }: { file: File; reason: string }) => {
        console.log(`- ${file.name}: ${reason}`);
      });
    }

    if (valid.length === 0) {
      console.error("No valid images found");
      process.exit(1);
    }

    console.log(`\nUploading ${valid.length} valid images...`);
    const results = await uploadPhotos(valid, giftId);

    console.log("\nUpload complete!");
    console.log("Gift ID:", giftId);
    console.log("Uploaded images:", results.length);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
