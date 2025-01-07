require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

// Load both .env and .env.local
dotenv.config({ path: "../.env.local" });
dotenv.config({ path: "../.env" });

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  zksolc: {
    version: "1.5.8",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: "matterlabs/zksolc",
        tag: "v1.5.8",
      },
    },
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

  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

module.exports = config;
