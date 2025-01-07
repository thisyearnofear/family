import { useAccount } from "wagmi";
import {
  UserGroupIcon,
  LockClosedIcon,
  PencilSquareIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

interface Web3FeaturesProps {
  isOwner?: boolean;
  isEditor?: boolean;
}

export function Web3Features({ isOwner, isEditor }: Web3FeaturesProps) {
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-medium text-center mb-6">
        Your Web3 Capabilities
      </h3>

      <div className="space-y-4">
        {isOwner && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <KeyIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium">Owner Permissions</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  Invite editors and viewers
                </li>
                <li className="flex items-center gap-2">
                  <LockClosedIcon className="w-4 h-4" />
                  Control access permissions
                </li>
                <li className="flex items-center gap-2">
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit gift content anytime
                </li>
              </ul>
            </div>
          </div>
        )}

        {isEditor && !isOwner && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <PencilSquareIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Editor Permissions</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit gift content
                </li>
                <li className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  View collaborators
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> As per the smart contract, owners can:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-blue-700">
            <li>Create invites with expiry times</li>
            <li>Assign editor or viewer roles</li>
            <li>Manage gift permissions</li>
            <li>Transfer ownership if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
