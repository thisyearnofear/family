import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from "@utils/constants";
import type { Role, CurrentInvite } from "@utils/types/gift";
import { useEnsName, useEnsAddress } from "wagmi";
import { Address } from "viem";
import { useInvites } from "@hooks/useInvites";

interface PermissionsManagerProps {
  giftId: string;
  currentEditors: string[];
  onInvite: (address: string, role: Role) => Promise<void>;
  onRemove: (address: string) => Promise<void>;
}

export function PermissionsManager({
  giftId,
  currentEditors,
  onInvite,
  onRemove,
}: PermissionsManagerProps) {
  const { address } = useAccount();
  const [inviteAddress, setInviteAddress] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [expiryDays, setExpiryDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const { invites, isLoading } = useInvites(giftId);

  // ENS resolution
  const { data: ensName } = useEnsName({
    address: inviteAddress as `0x${string}`,
  });
  const { data: ensAddress } = useEnsAddress({ name: inviteAddress });

  const handleCreateInvite = async () => {
    try {
      setError(null);
      const targetAddress = ensAddress || inviteAddress;

      if (!targetAddress || !targetAddress.startsWith("0x")) {
        throw new Error("Invalid address");
      }

      await onInvite(targetAddress, role);
      setInviteAddress("");
    } catch (err) {
      console.error("Error creating invite:", err);
      setError(err instanceof Error ? err.message : "Failed to create invite");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> As the owner, you can invite editors and viewers to collaborate on this gift.
        </p>
      </div>

      {/* Current Editors */}
      {currentEditors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Current Editors</h3>
          <div className="space-y-2">
            {currentEditors.map((editorAddress) => (
              <div
                key={editorAddress}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="font-mono text-sm text-gray-600">{editorAddress}</span>
                <button
                  onClick={() => onRemove(editorAddress)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites.outgoing.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Pending Invites</h3>
          <div className="space-y-2">
            {invites.outgoing.map((invite) => {
              const isExpired = Date.now() > invite.expiresAt * 1000;
              const isPending = !invite.accepted && !invite.cancelled && !isExpired;
              if (!isPending) return null;

              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-mono text-sm text-gray-600">{invite.to}</span>
                    <span className="text-sm text-gray-500 ml-2 capitalize">({invite.role})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Expires: {new Date(invite.expiresAt * 1000).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onRemove(invite.to)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Address or ENS Name
          </label>
          <input
            type="text"
            value={inviteAddress}
            onChange={(e) => {
              setInviteAddress(e.target.value);
              setError(null);
            }}
            placeholder="0x... or name.eth"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {ensName && (
            <p className="mt-1 text-sm text-gray-600">Resolved: {ensName}</p>
          )}
          {ensAddress && (
            <p className="mt-1 text-sm text-gray-600">Resolved: {ensAddress}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires In
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleCreateInvite}
          disabled={!inviteAddress}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send Invite
        </button>
      </div>
    </div>
  );
}
