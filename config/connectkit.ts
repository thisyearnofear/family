import { getDefaultConfig } from "connectkit";
import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { http } from "viem";

// Define Lens Network
const lensTestnet = {
  id: 37111,
  name: "Lens Testnet",
  network: "lens-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "LENS",
    symbol: "LENS",
  },
  rpcUrls: {
    public: { http: ["https://rpc.testnet.lens.dev"] },
    default: { http: ["https://rpc.testnet.lens.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: "https://block-explorer.testnet.lens.dev",
    },
  },
  testnet: true,
} as const;

// Check for required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  NEXT_PUBLIC_ALCHEMY_ID: process.env.NEXT_PUBLIC_ALCHEMY_ID,
};

// Validate all required environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

export const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    appName: "Famile",
    appDescription: "Deepen bonds, treasure memories",
    appUrl: "https://famile.xyz",
    appIcon: "/images/logo.png", // TODO: Add app icon
    chains: [mainnet, sepolia, lensTestnet],
    transports: {
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
      ),
      [sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
      ),
      [lensTestnet.id]: http("https://rpc.testnet.lens.dev"),
    },
  })
); 