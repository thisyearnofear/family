import { extractFileMetadata } from "../utils/api/pinata";
import fs from "fs";
import path from "path";

async function main() {
  const testDir = process.argv[2] || ".";
  console.log(`Testing files in ${testDir}`);

  try {
    const files = fs.readdirSync(testDir);
    console.log(`Found ${files.length} files`);

    for (const filename of files) {
      console.log(`\nTesting ${filename}...`);
      const filePath = path.join(testDir, filename);
      const stats = fs.statSync(filePath);

      // Create a File object from the file
      const fileBuffer = fs.readFileSync(filePath);
      const file = new File([fileBuffer], filename, {
        type: "image/jpeg",
        lastModified: stats.mtimeMs,
      });

      const metadata = await extractFileMetadata(file);
      console.log(`Metadata:`, metadata);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
