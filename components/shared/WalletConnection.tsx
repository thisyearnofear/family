import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useNameService } from "@hooks/useNameService";

const LENS_TESTNET_ID = 37111;

interface WalletConnectionProps {
  onPrevious: () => void;
  onNext: () => void;
}

export function WalletConnection({
  onPrevious,
  onNext,
}: WalletConnectionProps) {
  const { address, isConnected, chain } = useAccount();
  const isCorrectNetwork = chain?.id === LENS_TESTNET_ID;
  const { displayName } = useNameService(address);

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
      <p className="text-gray-600">
        Optional but enables collaboration features
      </p>

      <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
        <p className="font-medium text-gray-700">
          With a connected wallet you can:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Edit or delete your gift later</li>
          <li>• Invite family members to collaborate</li>
          <li>• Control who can view or edit</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <ConnectKitButton />
      </div>

      {isConnected && !isCorrectNetwork && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-700">
            Please switch to Lens Network to continue
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 text-blue-600 hover:text-blue-700"
        >
          {isConnected ? "Continue" : "Skip for now"}
        </button>
      </div>

      {!isConnected && (
        <div className="text-sm text-gray-500 pt-4">
          You can still create and share your gift without connecting.
          <br />
          Just note that you won&apos;t be able to edit it later.
        </div>
      )}
    </div>
  );
}
