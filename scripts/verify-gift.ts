import { PinataClient } from "./pinata-client.ts";
import dotenv from "dotenv";
import path from "path";

async function verifyGift(giftId: string) {
  // Load environment variables
  const envPath = path.join(process.cwd(), ".env.local");
  dotenv.config({ path: envPath });

  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Missing Pinata configuration");
  }

  // Initialize Pinata client
  const pinata = new PinataClient(apiKey, apiSecret);

  console.log("🔍 Looking for gift files...");

  // First, find the metadata file
  const metadataFiles = await pinata.pinList({
    metadata: {
      keyvalues: {
        giftId: {
          value: giftId,
          op: "eq",
        },
        type: {
          value: "metadata",
          op: "eq",
        },
      },
    },
  });

  if (metadataFiles.rows.length === 0) {
    throw new Error("Gift metadata not found");
  }

  const metadataCid = metadataFiles.rows[0].ipfs_pin_hash;
  console.log("✅ Found metadata:", metadataCid);

  // Find all image files
  const imageFiles = await pinata.pinList({
    metadata: {
      keyvalues: {
        giftId: {
          value: giftId,
          op: "eq",
        },
        type: {
          value: "image",
          op: "eq",
        },
      },
    },
  });

  console.log(`✅ Found ${imageFiles.rows.length} images:`);
  imageFiles.rows.forEach((file) => {
    console.log(`- ${file.metadata?.name || file.ipfs_pin_hash}`);
  });

  return {
    metadataCid,
    imageCount: imageFiles.rows.length,
    images: imageFiles.rows.map((file) => ({
      name: file.metadata?.name,
      cid: file.ipfs_pin_hash,
    })),
  };
}

async function main() {
  try {
    // Get gift ID from command line
    if (process.argv.length < 3) {
      console.error("Usage: npx ts-node scripts/verify-gift.ts <gift-id>");
      process.exit(1);
    }

    const giftId = process.argv[2];
    const result = await verifyGift(giftId);

    console.log("\n✨ Gift verification complete!");
    console.log("Metadata CID:", result.metadataCid);
    console.log("Number of images:", result.imageCount);
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
