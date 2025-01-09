import { type Chain } from "viem";

export const lensChain = {
  id: 37111,
  name: "Lens Network Sepolia Testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: "GRASS",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.lens.dev"] },
    public: { http: ["https://rpc.testnet.lens.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: "https://block-explorer.testnet.lens.dev",
    },
  },
} as const satisfies Chain;
