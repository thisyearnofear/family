import * as dotenv from "dotenv";
import axios from "axios";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function createNewGroup() {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("PINATA_JWT not found in environment variables");
    }

    console.log("Creating group...");

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: {
          name: "Family Gallery",
          description: "A collection of family photos",
          images: [],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (response.data.IpfsHash) {
      console.log("Created collection with IPFS hash:", response.data.IpfsHash);
      console.log("Add this hash to your .env.local file as PINATA_GROUP_ID");
    } else {
      console.error("Unexpected response:", response.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
    } else {
      console.error("Error creating group:", error);
    }
  }
}

createNewGroup();
