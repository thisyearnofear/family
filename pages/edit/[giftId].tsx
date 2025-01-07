import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { checkGiftPermissions } from "../../utils/helpers/permissions";
import { fetchGiftMetadata } from "../../utils/api/pinata/metadata";
import type { GiftPermissions } from "../../utils/types/collaborative";
import type { CollaborativeGift } from "../../utils/types/collaborative";
import EditGiftFlow from "../../components/ui/EditGiftFlow";

export default function EditGiftPage() {
  const router = useRouter();
  const { giftId } = router.query;
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gift, setGift] = useState<CollaborativeGift | null>(null);
  const [permissions, setPermissions] = useState<GiftPermissions | null>(null);

  useEffect(() => {
    async function loadGiftAndPermissions() {
      if (!giftId || typeof giftId !== "string" || !isConnected || !address) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch gift metadata
        const giftData = await fetchGiftMetadata(giftId);
        if (!giftData) {
          throw new Error("Gift not found");
        }
        setGift(giftData);

        // Check permissions
        const perms = await checkGiftPermissions(giftId, address);
        if (!perms.canEdit) {
          throw new Error("You don't have permission to edit this gift");
        }
        setPermissions(perms);
      } catch (err) {
        console.error("Error loading gift:", err);
        setError(err instanceof Error ? err.message : "Failed to load gift");
      } finally {
        setIsLoading(false);
      }
    }

    loadGiftAndPermissions();
  }, [giftId, isConnected, address]);

  // Loading state
  if (isLoading || !giftId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-teal-50">
        <div className="max-w-md w-full px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <div className="animate-spin text-2xl mb-4">⏳</div>
            <p className="text-gray-600/90 font-['Lora']">
              Loading gift details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-teal-50">
        <div className="max-w-md w-full px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <h1 className="text-2xl font-['Lora'] text-gray-800/90 mb-4">
              Connect Wallet to Edit
            </h1>
            <p className="text-gray-600/90 mb-6 font-['Lora']">
              To edit this memory, please connect your wallet first.
            </p>
            <ConnectKitButton />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-teal-50">
        <div className="max-w-md w-full px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <h1 className="text-2xl font-['Lora'] text-gray-800/90 mb-4">
              {error === "Gift not found" ? "Gift Not Found" : "Access Denied"}
            </h1>
            <p className="text-red-600/90 mb-6 font-['Lora']">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No gift or permissions state
  if (!gift || !permissions) {
    return null;
  }

  const handleSave = async (updates: Partial<CollaborativeGift>) => {
    try {
      // Verify permissions again before saving
      const currentPerms = await checkGiftPermissions(
        giftId as string,
        address!
      );
      if (!currentPerms.canEdit) {
        throw new Error("You no longer have permission to edit this gift");
      }

      // TODO: Implement save functionality
      console.log("Saving updates:", updates);

      // Update local gift state
      setGift((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error("Error saving gift:", err);
      throw err;
    }
  };

  return (
    <EditGiftFlow
      gift={gift}
      userRole={permissions.canInvite ? "owner" : "editor"}
      onSave={handleSave}
      onClose={() => router.push("/")}
    />
  );
}
