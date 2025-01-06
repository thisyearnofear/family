import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { PinataSDK as PinataIPFS } from "pinata-web3";

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

// Validate environment first
function validateEnvironment() {
  // Load environment variables from .env.local
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      ".env.local file not found. Please copy .env.example to .env.local and fill in your Pinata credentials."
    );
  }
  dotenv.config({ path: envPath });

  // Check required environment variables
  const PINATA_JWT =
    process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
  const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  if (!PINATA_JWT || !PINATA_GATEWAY) {
    throw new Error(
      "Missing Pinata configuration. Please ensure PINATA_JWT and PINATA_GATEWAY are set in .env.local"
    );
  }

  return { PINATA_JWT, PINATA_GATEWAY };
}

// Validate and prepare directory
function prepareDirectory(directoryPath) {
  // Convert to absolute path if relative
  const absolutePath = path.resolve(directoryPath);

  // Check if directory exists
  if (!fs.existsSync(absolutePath)) {
    console.log(`Directory ${absolutePath} does not exist. Creating it...`);
    try {
      fs.mkdirSync(absolutePath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  // Verify it's a directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    throw new Error(`${absolutePath} exists but is not a directory`);
  }

  return absolutePath;
}

// Get files from directory
function getImagesFromDirectory(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|gif)$/i.test(file)
  );

  if (imageFiles.length === 0) {
    throw new Error(
      `No image files found in ${directoryPath}. Supported formats: jpg, jpeg, png, gif`
    );
  }

  console.log(`Found ${imageFiles.length} image files:`);
  imageFiles.forEach((file) => console.log(`- ${file}`));

  return imageFiles.map((file) => {
    const filePath = path.join(directoryPath, file);
    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new File([buffer], file, {
      type: `image/${path.extname(file).slice(1)}`,
      lastModified: stats.mtimeMs,
    });
  });
}

async function createGift(files, theme = "space", messages = [], music = []) {
  try {
    console.log("📦 Creating gift with:", {
      fileCount: files.length,
      theme,
      messageCount: messages.length,
      musicCount: music.length,
    });

    const { PINATA_JWT, PINATA_GATEWAY } = validateEnvironment();

    // Initialize IPFS SDK
    const pinata = new PinataIPFS({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    // Test Pinata connection
    try {
      await pinata.groups.list();
    } catch (error) {
      throw new Error(`Failed to connect to Pinata: ${error.message}`);
    }

    // 1. Create a new group for this gift
    console.log("📁 Creating new group...");
    const group = await pinata.groups.create({
      name: `Gift-${new Date().toISOString()}`,
    });
    const groupId = group.id;
    console.log("✅ Created group:", groupId);

    // 2. Upload images and add to group
    console.log("🖼️ Uploading images to IPFS...");
    const uploadedImages = await Promise.all(
      files.map(async (file, index) => {
        try {
          // Upload file to IPFS and directly add to group
          console.log(
            `📤 Uploading image ${index + 1}/${files.length}: ${file.name}...`
          );
          const upload = await pinata.upload.file(file).group(groupId);
          const cid = upload.IpfsHash;

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
            url: `${PINATA_GATEWAY}/ipfs/${cid}`,
          };
        } catch (error) {
          throw new Error(`Failed to process ${file.name}: ${error.message}`);
        }
      })
    );

    // 3. Create and upload the gift metadata
    console.log("📄 Creating gift metadata...");
    const giftData = {
      theme,
      images: uploadedImages,
      messages,
      music,
      createdAt: new Date().toISOString(),
    };

    console.log("📄 Uploading gift metadata to IPFS...");
    const metadataUpload = await pinata.upload.json(giftData).group(groupId);
    const metadataCid = metadataUpload.IpfsHash;

    // Wait a bit for files to be processed
    console.log("⏳ Waiting for files to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get group info to check CIDs with retries
    let groupInfo;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      groupInfo = await pinata.groups.get({ groupId });
      // @ts-ignore - Pinata SDK types are incomplete
      const groupCids = groupInfo?.cids || [];

      console.log(`📋 Group info (attempt ${retries + 1}):`, groupInfo);
      console.log(`📋 Found ${groupCids.length} CIDs in group`);

      if (groupCids.length > 0) break;

      retries++;
      if (retries < maxRetries) {
        console.log(`Waiting ${5 * retries}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 5000 * retries));
      }
    }

    // @ts-ignore - Pinata SDK types are incomplete
    const groupCids = groupInfo?.cids || [];

    if (!groupCids || groupCids.length === 0) {
      console.warn("⚠️ No files found in group");
      return {
        giftId: groupId,
        fileCount: files.length + 1,
        status: "pending",
        pendingCids: [
          ...uploadedImages.map((img) => img.ipfsHash),
          metadataCid,
        ],
      };
    }

    // Check if all our files are present
    const expectedCids = [
      ...uploadedImages.map((img) => img.ipfsHash),
      metadataCid,
    ];

    console.log("🔍 Checking files:", {
      expected: expectedCids,
      found: groupCids,
    });

    const missingCids = expectedCids.filter((cid) => !groupCids.includes(cid));

    if (missingCids.length > 0) {
      console.warn("⚠️ Some files are missing from the group:", missingCids);
      return {
        giftId: groupId,
        fileCount: files.length + 1,
        status: "pending",
        pendingCids: missingCids,
      };
    }

    console.log("🎁 Gift created successfully! Group ID:", groupId);
    return {
      giftId: groupId,
      fileCount: files.length + 1,
      status: "ready",
    };
  } catch (error) {
    console.error("❌ Error creating gift:", error);
    throw error;
  }
}

async function main() {
  try {
    // 1. Validate command line arguments
    if (process.argv.length < 3) {
      console.error("Usage: node upload-images.mjs <directory-path>");
      console.error("Example: node upload-images.mjs ~/Desktop/family-photos");
      process.exit(1);
    }

    const directoryPath = process.argv[2];

    // 2. Validate environment and directory
    console.log("🔍 Validating environment...");
    validateEnvironment();

    console.log("📁 Preparing directory...");
    const absolutePath = prepareDirectory(directoryPath);
    console.log(`📁 Using directory: ${absolutePath}`);

    // 3. Get and validate image files
    console.log("🖼️ Looking for images...");
    const files = getImagesFromDirectory(absolutePath);

    // 4. Add default messages and music from our demo
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

    // 5. Create the gift
    console.log(`\n📤 Uploading ${files.length} images...`);
    const result = await createGift(files, "space", messages, music);

    // 6. Show results
    console.log("\n✨ Upload complete!");
    console.log("Gift ID:", result.giftId);
    console.log("Status:", result.status);
    if (result.pendingCids) {
      console.log("Pending CIDs:", result.pendingCids);
    }

    // 7. Show next steps
    console.log("\n📝 Next steps:");
    console.log("1. Copy your Gift ID:", result.giftId);
    console.log("2. Go to the app and click 'Unwrap a Gift'");
    console.log("3. Paste your Gift ID and enjoy!");

    if (result.status === "pending") {
      console.log("\n⚠️ Note: Some files are still processing.");
      console.log("You may need to wait a few moments before unwrapping.");
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
