import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { useNameService } from "./useNameService";

export function useWallet() {
  const { address, isConnecting, isDisconnected, isConnected } = useAccount();
  const { data: wagmiEnsName } = useEnsName({ address });
  const { ensName: web3BioEnsName, lensName } = useNameService(address);
  const { disconnect } = useDisconnect();

  // Prefer wagmi ENS resolution, fallback to web3.bio
  const ensName = wagmiEnsName || web3BioEnsName;

  return {
    address,
    ensName,
    lensName,
    isConnecting,
    isDisconnected,
    isConnected,
    disconnect,
    displayName:
      ensName || lensName || address?.slice(0, 6) + "..." + address?.slice(-4),
  };
}
