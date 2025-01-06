import { PinataSDK as PinataIPFS } from "pinata-web3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Verifies that CIDs have been added to a group
 */
async function verifyCidsInGroup(
  pinata,
  groupId,
  expectedCids,
  maxRetries = 3,
  delayMs = 5000
) {
  console.log(`\n🔍 Verifying ${expectedCids.length} files in group...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get group info
      const groupInfo = await pinata.groups.get({ groupId });
      console.log(`\n📋 Attempt ${attempt}/${maxRetries}:`);

      // Get CIDs from group
      const groupCids = groupInfo?.cids || [];
      console.log(`Found ${groupCids.length} CIDs in group`);

      // Check if all expected CIDs are present
      const missingCids = expectedCids.filter(
        (cid) => !groupCids.includes(cid)
      );

      if (missingCids.length === 0) {
        console.log("✅ All CIDs verified in group");
        return true;
      }

      console.log(`⏳ Missing ${missingCids.length} CIDs:`, missingCids);

      if (attempt < maxRetries) {
        console.log(`Waiting ${delayMs}ms before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(
        `Error checking contents (attempt ${attempt}):`,
        error.message
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Files not verified after ${maxRetries} attempts`);
}

async function main() {
  try {
    // Load environment variables from .env.local
    const envPath = path.join(dirname(__dirname), ".env.local");
    dotenv.config({ path: envPath });

    const jwt = process.env.PINATA_JWT;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

    if (!jwt || !gateway) {
      throw new Error(
        "Missing PINATA_JWT or PINATA_GATEWAY environment variables"
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataIPFS({
      pinataJwt: jwt,
      pinataGateway: gateway,
    });

    // Create test file
    console.log("\n📝 Creating test file...");
    const testFile = path.join(__dirname, "test.txt");
    fs.writeFileSync(testFile, "Hello Pinata!");

    // Create a File object from the test file
    const fileBuffer = fs.readFileSync(testFile);
    const file = new File([fileBuffer], "test.txt", {
      type: "text/plain",
      lastModified: Date.now(),
    });

    // Create group first
    console.log("\n👥 Creating group...");
    const group = await pinata.groups.create({
      name: `Test Group ${new Date().toISOString()}`,
    });
    console.log("Group created:", group);

    // Upload file and add to group in one step
    console.log("\n📤 Uploading file and adding to group...");
    const result = await pinata.upload.file(file).group(group.id);
    console.log("Upload result:", result);

    // Wait for files to be processed
    console.log("\n⏳ Waiting for files to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify the file is in the group
    await verifyCidsInGroup(pinata, group.id, [result.IpfsHash]);

    // Cleanup
    fs.unlinkSync(testFile);
    console.log("\n✨ Test complete!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
}

main();
