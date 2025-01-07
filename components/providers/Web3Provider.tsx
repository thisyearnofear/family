"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { injected } from "wagmi/connectors";

// Check if required environment variables are present
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
}

if (!process.env.NEXT_PUBLIC_ALCHEMY_ID) {
  throw new Error("Missing NEXT_PUBLIC_ALCHEMY_ID");
}

// Add your contract deployment network
const lensTestnet = {
  id: 37111,
  name: "Lens Network Sepolia Testnet",
  network: "lens-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "GRASS",
    symbol: "GRASS",
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.lens.dev"] },
    public: { http: ["https://rpc.testnet.lens.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://block-explorer.testnet.lens.dev",
    },
  },
  testnet: true,
};

const config = createConfig({
  chains: [lensTestnet],
  transports: {
    [lensTestnet.id]: http(),
  },
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
});

const queryClient = new QueryClient();

const customTheme = {
  "--ck-font-family": "inherit",
  "--ck-border-radius": "0.75rem",
  "--ck-overlay-background": "rgba(0, 0, 0, 0.8)",
  "--ck-modal-box-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  "--ck-body-background": "white",
  "--ck-body-color": "#1a1a1a",
  "--ck-body-color-muted": "#6b7280",
  "--ck-body-action-color": "#2563eb",
  "--ck-body-divider": "#e5e7eb",
  "--ck-primary-button-background": "#2563eb",
  "--ck-primary-button-hover-background": "#1d4ed8",
  "--ck-primary-button-color": "white",
  "--ck-secondary-button-background": "#f3f4f6",
  "--ck-secondary-button-hover-background": "#e5e7eb",
  "--ck-secondary-button-color": "#1f2937",
  "--ck-connectbutton-font-size": "0.875rem",
  "--ck-connectbutton-border-radius": "0.75rem",
  "--ck-connectbutton-color": "#1f2937",
  "--ck-connectbutton-background": "white",
  "--ck-connectbutton-box-shadow": "inset 0 0 0 1px #e5e7eb",
  "--ck-connectbutton-hover-background": "#f9fafb",
  "--ck-connectbutton-hover-box-shadow": "inset 0 0 0 1px #d1d5db",
  "--ck-connectbutton-active-background": "#f3f4f6",
} as const;

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="rounded"
          options={{
            hideBalance: true,
            hideTooltips: true,
            hideQuestionMarkCTA: true,
            embedGoogleFonts: true,
            enforceSupportedChains: false,
            initialChainId: lensTestnet.id,
          }}
          customTheme={customTheme}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
