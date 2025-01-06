import { PinataClient } from "./pinata-client.ts";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Blob } from "buffer";

// Polyfill for File class since we're in Node.js
class NodeFile {
  name: string;
  lastModified: number;
  type: string;
  private buffer: Buffer;

  constructor(
    buffer: Buffer,
    name: string,
    options?: { type?: string; lastModified?: number }
  ) {
    this.buffer = buffer;
    this.name = name;
    this.type = options?.type || "";
    this.lastModified = options?.lastModified || Date.now();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.buffer.buffer;
  }
}

async function createGift(
  files: NodeFile[],
  theme: "space" | "japanese",
  messages: string[] = [],
  music: string[] = []
) {
  // Load environment variables
  const envPath = path.join(process.cwd(), ".env.local");
  dotenv.config({ path: envPath });

  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  if (!apiKey || !apiSecret || !gateway) {
    throw new Error("Missing Pinata configuration");
  }

  // Initialize Pinata client
  const pinata = new PinataClient(apiKey, apiSecret);

  // Generate a unique gift ID
  const giftId = `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  console.log("📦 Gift ID:", giftId);

  // Upload images
  console.log("🖼️ Uploading images to IPFS...");
  const uploadedImages = await Promise.all(
    files.map(async (file, index) => {
      try {
        // Convert File to ReadableStream
        const buffer = await file.arrayBuffer();
        const tempPath = path.join(process.cwd(), ".temp", file.name);
        await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.promises.writeFile(tempPath, Buffer.from(buffer));

        // Upload file to IPFS
        console.log(
          `📤 Uploading image ${index + 1}/${files.length}: ${file.name}...`
        );
        const readableStreamForFile = fs.createReadStream(tempPath);
        const options = {
          pinataMetadata: {
            name: file.name,
            keyvalues: {
              giftId,
              type: "image",
              index: String(index + 1),
            },
          },
        };
        const result = await pinata.pinFileToIPFS(
          readableStreamForFile,
          options
        );
        const cid = result.IpfsHash;

        // Clean up temp file
        await fs.promises.unlink(tempPath);

        console.log(
          `✅ Uploaded image ${index + 1}/${files.length}:`,
          file.name,
          cid
        );

        return {
          id: index + 1,
          name: file.name,
          description: `Photo taken on ${new Date(
            file.lastModified
          ).toLocaleDateString()}`,
          ipfsHash: cid,
          dateTaken: new Date(file.lastModified).toISOString(),
          width: 1280,
          height: 720,
          url: `${gateway}/ipfs/${cid}`,
        };
      } catch (error) {
        throw new Error(
          `Failed to process ${file.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    })
  );

  // Create and upload the gift metadata
  console.log("📄 Creating gift metadata...");
  const giftData = {
    id: giftId,
    theme,
    images: uploadedImages,
    messages,
    music,
    createdAt: new Date().toISOString(),
  };

  // Upload metadata
  console.log("📄 Uploading gift metadata to IPFS...");
  const metadataUpload = await pinata.pinJSONToIPFS({
    ...giftData,
    pinataMetadata: {
      name: `${giftId}-metadata`,
      keyvalues: {
        giftId,
        type: "metadata",
      },
    },
  });
  const metadataCid = metadataUpload.IpfsHash;

  // Wait for files to be processed
  console.log("⏳ Waiting for files to be processed...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Get all files for this gift
  const giftFiles = await pinata.pinList({
    metadata: {
      keyvalues: {
        giftId: {
          value: giftId,
          op: "eq",
        },
      },
    },
  });

  // Check if all files are present
  const allCids = [...uploadedImages.map((img) => img.ipfsHash), metadataCid];
  const foundCids = giftFiles.rows.map((row) => row.ipfs_pin_hash);
  const missingCids = allCids.filter((cid) => !foundCids.includes(cid));

  if (missingCids.length > 0) {
    console.warn("⚠️ Some files are missing:", missingCids);
    return {
      giftId,
      metadataCid,
      fileCount: files.length + 1,
      status: "pending",
      pendingCids: missingCids,
    };
  }

  console.log("🎁 Gift created successfully!");
  console.log("Gift ID:", giftId);
  console.log("Metadata CID:", metadataCid);

  return {
    giftId,
    metadataCid,
    fileCount: files.length + 1,
    status: "ready",
  };
}

async function main() {
  try {
    // Validate command line arguments
    if (process.argv.length < 3) {
      console.error(
        "Usage: npx ts-node scripts/upload-images.ts <directory-path>"
      );
      console.error(
        "Example: npx ts-node scripts/upload-images.ts ~/Desktop/family-photos"
      );
      process.exit(1);
    }

    const directoryPath = process.argv[2];
    const absolutePath = path.resolve(directoryPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(absolutePath)) {
      console.log(`Creating directory: ${absolutePath}`);
      fs.mkdirSync(absolutePath, { recursive: true });
    }

    // Get and validate image files
    console.log("🖼️ Looking for images...");
    const files = fs
      .readdirSync(absolutePath)
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map((file) => {
        const filePath = path.join(absolutePath, file);
        const buffer = fs.readFileSync(filePath);
        return new NodeFile(buffer, file, {
          type: `image/${path.extname(file).slice(1)}`,
          lastModified: fs.statSync(filePath).mtimeMs,
        });
      });

    console.log(`Found ${files.length} image files`);
    files.forEach((file) => console.log(`- ${file.name}`));

    if (files.length === 0) {
      console.error("\n❌ No images found in directory");
      console.log("Supported formats: jpg, jpeg, png, gif");
      process.exit(1);
    }

    // Add default messages and music from our demo
    const messages = [
      "Family is constant — gravity's centre, anchor in the cosmos.",
      "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
      "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
      "Love is infinite. Happiness innate. Seeing, believing ....",
    ];

    const music = [
      "/sounds/background-music.mp3",
      "/sounds/grow-old.mp3",
      "/sounds/mama.mp3",
      "/sounds/baba.mp3",
    ];

    // Create the gift
    console.log(`\n📤 Uploading ${files.length} images...`);
    const result = await createGift(files, "space", messages, music);

    // Show results
    console.log("\n✨ Upload complete!");
    console.log("Gift ID:", result.giftId);
    console.log("Status:", result.status);
    if (result.pendingCids) {
      console.log("Pending CIDs:", result.pendingCids);
    }

    // Show next steps
    console.log("\n📝 Next steps:");
    console.log("1. Copy your Gift ID:", result.giftId);
    console.log('2. Go to the app and click "Unwrap a Gift"');
    console.log("3. Paste your Gift ID and enjoy!");

    if (result.status === "pending") {
      console.log("\n⚠️ Note: Some files are still processing.");
      console.log("You may need to wait a few moments before unwrapping.");
    }
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
