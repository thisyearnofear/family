const dotenv = require("dotenv");
const axios = require("axios");
const { uploadImagesFromDirectory } = require("../utils/uploadImages");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const directoryPath = process.argv[2];

if (!directoryPath) {
  console.error("Please provide the directory path as an argument");
  process.exit(1);
}

async function uploadToGroup() {
  try {
    const groupId = process.env.PINATA_GROUP_ID;
    if (!groupId) {
      throw new Error("PINATA_GROUP_ID not found in environment variables");
    }

    // First, upload the images and get their CIDs
    console.log("Uploading images...");
    const uploadedImages = await uploadImagesFromDirectory(directoryPath);
    console.log(`Uploaded ${uploadedImages.length} images`);

    // Sort images by date taken
    uploadedImages.sort((a, b) => {
      if (!a.dateTaken) return 1;
      if (!b.dateTaken) return -1;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
    });

    // Then update the group JSON with the new images
    console.log("Updating group collection...");
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: {
          name: "Family Gallery",
          description: "A collection of family photos",
          images: uploadedImages,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    console.log(
      "Updated collection with new IPFS hash:",
      response.data.IpfsHash
    );
    console.log("Update your PINATA_GROUP_ID in .env.local with this new hash");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
    } else {
      console.error("Error:", error);
    }
  }
}

uploadToGroup();
