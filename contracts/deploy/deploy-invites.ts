const { Deployer } = require("@matterlabs/hardhat-zksync");
const { Wallet } = require("zksync-ethers");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from both files
dotenv.config({ path: path.join(__dirname, "../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * @param {import('hardhat/types').HardhatRuntimeEnvironment} hre
 */
async function main(hre) {
  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required in environment variables");
  }

  try {
    // Initialize the wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY);

    // Create deployer object
    const deployer = new Deployer(hre, wallet);

    // Load the artifact
    const artifact = await deployer.loadArtifact("FamileInvites");

    // Deploy the contract
    console.log("Deploying FamileInvites contract...");
    const contract = await deployer.deploy(artifact, []);

    // Show the contract info
    const address = await contract.getAddress();
    console.log(`FamileInvites was deployed to ${address}`);

    // Return the contract and deployer for testing
    return { contract, deployer };
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// Cleanup function
process.on("SIGINT", () => {
  console.log("Cleaning up...");
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("Cleaning up...");
  process.exit();
});

// Export for hardhat
module.exports = main;
