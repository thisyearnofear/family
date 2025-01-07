import { useAccount, useDisconnect, useEnsName } from "wagmi";

export function useWallet() {
  const { address, isConnecting, isDisconnected, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { disconnect } = useDisconnect();

  return {
    address,
    ensName,
    isConnecting,
    isDisconnected,
    isConnected,
    disconnect,
    displayName: ensName || address?.slice(0, 6) + "..." + address?.slice(-4),
  };
}
