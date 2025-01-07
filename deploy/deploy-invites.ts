const { Deployer } = require("@matterlabs/hardhat-zksync");
const { Wallet } = require("zksync-ethers");

async function main(hre) {
  // Initialize the wallet
  const wallet = new Wallet(process.env.PRIVATE_KEY);

  // Create deployer object
  const deployer = new Deployer(hre, wallet);

  // Load the artifact
  const artifact = await deployer.loadArtifact("FamileInvites");

  // Deploy the contract
  const contract = await deployer.deploy(artifact, []);

  // Show the contract info
  const address = await contract.getAddress();
  console.log(`FamileInvites was deployed to ${address}`);

  // Return the contract and deployer for testing
  return { contract, deployer };
}

module.exports = main;
