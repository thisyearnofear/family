import { useAccount, useSwitchChain } from "wagmi";
import { lensChain } from "@utils/constants/chains";

interface NetworkSwitchProps {
  className?: string;
}

export function NetworkSwitch({ className }: NetworkSwitchProps) {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!chain || chain.id === lensChain.id) return null;

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-yellow-50 rounded-lg p-4">
        <p className="text-sm text-yellow-800 mb-3">
          Please switch to {lensChain.name} to continue
        </p>
        <button
          onClick={() => switchChain({ chainId: lensChain.id })}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
        >
          Switch to {lensChain.name}
        </button>
      </div>
    </div>
  );
}
