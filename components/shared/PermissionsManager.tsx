import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from "@utils/constants";
import type { Role, CurrentInvite } from "@utils/types/gift";
import { useEnsName, useEnsAddress } from "wagmi";
import { Address } from "viem";

interface PermissionsManagerProps {
  giftId: string;
  isOwner: boolean;
  onInviteCreated?: (invite: CurrentInvite) => void;
}

export function PermissionsManager({
  giftId,
  isOwner,
  onInviteCreated,
}: PermissionsManagerProps) {
  const { address } = useAccount();
  const [inviteAddress, setInviteAddress] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [expiryDays, setExpiryDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [currentInvites, setCurrentInvites] = useState<CurrentInvite[]>([]);

  // ENS resolution
  const { data: ensName } = useEnsName({
    address: inviteAddress as `0x${string}`,
  });
  const { data: ensAddress } = useEnsAddress({ name: inviteAddress });

  const { writeContract } = useWriteContract();

  const handleCreateInvite = async () => {
    try {
      setError(null);
      const targetAddress = ensAddress || inviteAddress;

      if (!targetAddress || !targetAddress.startsWith("0x")) {
        throw new Error("Invalid address");
      }

      const newInvite: CurrentInvite = {
        address: targetAddress,
        role,
        invitedAt: new Date().toISOString(),
        status: "pending",
        expiresAt: new Date(
          Date.now() + expiryDays * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      // Add to current invites before sending to contract
      setCurrentInvites((prev) => [...prev, newInvite]);

      await writeContract({
        address: FAMILE_INVITES_ADDRESS as Address,
        abi: FAMILE_INVITES_ABI,
        functionName: "createInvite",
        args: [
          targetAddress as Address,
          giftId,
          role,
          BigInt(expiryDays * 24 * 60 * 60), // Convert days to seconds
        ] as const,
      });

      setInviteAddress("");
      onInviteCreated?.(newInvite);
    } catch (err) {
      console.error("Error creating invite:", err);
      setError(err instanceof Error ? err.message : "Failed to create invite");
      // Remove from current if failed
      setCurrentInvites((prev) =>
        prev.filter((p) => p.address !== (ensAddress || inviteAddress))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong>{" "}
          {isOwner
            ? "As the owner, you can invite editors and viewers to collaborate on this gift."
            : "As an editor, you can invite others to view or edit this gift."}
        </p>
      </div>

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
