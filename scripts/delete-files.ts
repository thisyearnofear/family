import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: ".env.local" });

async function deleteAllFiles() {
  try {
    console.log("Fetching file list...");
    const response = await axios.get("https://api.pinata.cloud/data/pinList", {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    const hashes = response.data.rows.map((pin: any) => pin.ipfs_pin_hash);
    console.log(`Found ${hashes.length} files to delete`);

    for (const hash of hashes) {
      console.log(`Deleting ${hash}...`);
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });
    }

    console.log("All files deleted successfully!");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
    } else {
      console.error("Error:", error);
    }
  }
}

deleteAllFiles();
