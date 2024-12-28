import { extractDateFromFileName } from "../utils/pinata/uploadPhotos.js";
import fs from "fs";

async function main() {
  const directoryPath = process.argv[2];
  if (!directoryPath) {
    console.error("Please provide a directory path");
    process.exit(1);
  }

  try {
    const files = fs
      .readdirSync(directoryPath)
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

    console.log(`Found ${files.length} image files`);

    for (const file of files) {
      console.log(`\nTesting ${file}...`);
      const dateFromName = extractDateFromFileName(file);
      if (dateFromName) {
        console.log(`Date from filename: ${dateFromName}`);
      } else {
        console.log("No date found in filename");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
