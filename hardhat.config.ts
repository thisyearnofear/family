require("@matterlabs/hardhat-zksync");
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

// Load both .env and .env.local
dotenv.config({ path: ".env.local" });
dotenv.config();

const config = {
  solidity: "0.8.19",

  zksolc: {
    version: "latest",
    settings: {},
  },

  networks: {
    lensTestnet: {
      chainId: 37111,
      ethNetwork: "sepolia",
      url: "https://rpc.testnet.lens.dev",
      verifyURL:
        "https://block-explorer-verify.testnet.lens.dev/contract_verification",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    },

    hardhat: {
      zksync: true,
    },
  },
};

module.exports = config;
