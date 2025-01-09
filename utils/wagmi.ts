import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { lensChain } from "./constants";

export const config = createConfig({
  chains: [mainnet, lensChain],
  transports: {
    [mainnet.id]: http(),
    [lensChain.id]: http(lensChain.rpcUrls.default.http[0]),
  },
});
