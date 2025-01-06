import { PinataClient } from "./pinata-client.mjs";
import FormData from "form-data";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(dirname(__dirname), ".env.local");
dotenv.config({ path: envPath });

const JWT = process.env.PINATA_JWT;
if (!JWT) {
  throw new Error("PINATA_JWT environment variable is not set");
}

const pinata = new PinataClient(JWT);

async function main() {
  console.log("\n🔄 Initializing...");

  // Create test file
  console.log("\n📝 Creating test file...");
  const content = "Hello, Pinata!";
  const testFilePath = path.join(__dirname, "test.txt");
  fs.writeFileSync(testFilePath, content);

  // List existing pins
  console.log("\n📋 Listing existing pins...");
  const pins = await pinata.pinList();
  console.log("Existing pins:", pins);

  // Create new group
  const groupName = `Test Group ${new Date().toISOString()}`;
  console.log("\n👥 Creating new group...");
  const group = await pinata.createGroup(groupName);
  console.log("Group created:", group);

  // Upload file
  console.log("\n📤 Uploading file...");
  const readableStreamForFile = fs.createReadStream(testFilePath);
  const options = {
    pinataMetadata: {
      name: "test.txt",
      keyvalues: {
        groupId: group.IpfsHash,
      },
    },
  };
  const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
  console.log("Upload result:", result);

  // Clean up test file
  fs.unlinkSync(testFilePath);

  // Add file to group
  console.log("\n📌 Adding file to group...");
  await pinata.addToGroup(group.IpfsHash, result.IpfsHash);

  // Wait for file to be processed
  console.log("\n⏳ Waiting for file to be processed...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Verify file is in group
  const maxRetries = 5;
  const retryDelay = 10000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `\n📋 Checking group contents (attempt ${attempt}/${maxRetries})...`
    );
    const groupContents = await pinata.getGroupContents(group.IpfsHash);
    console.log("Group contents:", groupContents);

    if (groupContents && groupContents.rows && groupContents.rows.length > 0) {
      console.log("✅ File found in group!");
      break;
    }

    if (attempt < maxRetries) {
      console.log("Waiting for next attempt...");
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Remove file from group and unpin
  console.log("\n🗑️ Removing file from group...");
  await pinata.removeFromGroup(group.IpfsHash, result.IpfsHash);

  // Delete group
  console.log("\n🗑️ Deleting group...");
  await pinata.deleteGroup(group.IpfsHash);

  console.log("\n✨ Test complete!");
}

main().catch(console.error);
