import { useState, useEffect } from "react";
import type { Role, CurrentInvite } from "@utils/types/gift";
import { useEnsName, useEnsAddress } from "wagmi";

interface Web3BioProfile {
  address: string;
  identity: string;
  platform: string;
  displayName: string;
  avatar: string;
  description: string | null;
}

interface CollaboratorInputProps {
  onInviteCreated: (invite: CurrentInvite) => void;
  maxInvites?: number;
}

export function CollaboratorInput({
  onInviteCreated,
  maxInvites = 5,
}: CollaboratorInputProps) {
  const [invites, setInvites] = useState<CurrentInvite[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentRole, setCurrentRole] = useState<Role>("editor");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Web3BioProfile | null>(null);

  // Fetch profile info when input changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentInput || currentInput.length < 3) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try Lens resolution first if it's a Lens handle
        if (currentInput.endsWith(".lens") || currentInput.includes("@")) {
          const cleanHandle = currentInput
            .replace("@", "")
            .replace(".lens", "");
          const lensResponse = await fetch(
            `https://api.web3.bio/profile/lens/${cleanHandle}.lens`
          );
          if (lensResponse.ok) {
            const data = await lensResponse.json();
            setProfile(data);
            return;
          }
        }

        // Try ENS resolution if it looks like an ENS name
        if (currentInput.includes(".eth")) {
          const ensResponse = await fetch(
            `https://api.web3.bio/profile/ens/${currentInput}`
          );
          if (ensResponse.ok) {
            const data = await ensResponse.json();
            setProfile(data);
            return;
          }
        }

        // If specific resolutions fail, try universal profile lookup
        const universalResponse = await fetch(
          `https://api.web3.bio/profile/${currentInput}`
        );
        if (universalResponse.ok) {
          const data = await universalResponse.json();
          if (Array.isArray(data) && data.length > 0) {
            // Find the first profile that matches the platform we're looking for
            const matchingProfile = data.find(
              (p) =>
                (currentInput.endsWith(".lens") && p.platform === "lens") ||
                (currentInput.endsWith(".eth") && p.platform === "ens") ||
                p.platform === "ens" // Default to ENS if no specific match
            );
            setProfile(matchingProfile || data[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProfile, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [currentInput]);

  const handleAddInvite = async () => {
    try {
      setError(null);

      if (invites.length >= maxInvites) {
        throw new Error(`Maximum ${maxInvites} invites allowed`);
      }

      let targetAddress = profile?.address || currentInput;

      if (!targetAddress.startsWith("0x") && !profile?.address) {
        throw new Error(
          "Please wait for profile resolution or enter a valid address"
        );
      }

      const newInvite: CurrentInvite = {
        address: (profile?.address || targetAddress).toLowerCase(),
        role: currentRole,
        invitedAt: new Date().toISOString(),
        status: "pending",
        displayName: profile?.displayName,
        avatar: profile?.avatar,
      };

      setInvites((prev) => [...prev, newInvite]);
      onInviteCreated(newInvite);
      setCurrentInput("");
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-center mb-2">Optional</h3>
        <p className="text-sm text-gray-600 text-center">
          Enable others to edit this gift
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Enter ENS (e.g. vitalik.eth), Lens handle (e.g. stani.lens), or Eth
          address
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                setError(null);
              }}
              placeholder="Address, ENS, or Lens handle"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {profile && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{profile.displayName}</p>
              <p className="text-sm text-gray-600">{profile.identity}</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {invites.length > 0 && (
          <div className="space-y-2">
            {invites.map((invite, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {invite.avatar && (
                    <img
                      src={invite.avatar}
                      alt={invite.displayName || invite.address}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {invite.displayName || invite.address}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {invite.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setInvites((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {invites.length < maxInvites && (
          <button
            onClick={handleAddInvite}
            disabled={!currentInput || isLoading}
            className="w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Collaborator
          </button>
        )}
      </div>
    </div>
  );
}
