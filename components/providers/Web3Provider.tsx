"use client";

import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { mainnet } from "viem/chains";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { lensChain } from "@utils/constants/chains";

const config = createConfig(
  getDefaultConfig({
    // Your dApp's chains - include mainnet for ENS resolution
    chains: [lensChain, mainnet],
    transports: {
      [lensChain.id]: http(lensChain.rpcUrls.default.http[0]),
      [mainnet.id]: fallback([
        http(
          `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
        ),
        http("https://eth.llamarpc.com"),
        http("https://cloudflare-eth.com"),
      ]),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    // Required App Info
    appName: "Famile",

    // Optional App Info
    appDescription: "Family memories on-chain",
    appUrl: "https://famile.xyz",
    appIcon: "https://famile.xyz/logo.png",
  })
);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <ConnectKitProvider theme="retro">{children}</ConnectKitProvider>
    </WagmiProvider>
  );
};
