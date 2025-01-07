import { useState, useCallback } from "react";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { FamileInvites__factory } from "../typechain-types/factories/contracts/FamileInvites__factory";
import { useToast } from "@/components/ui/use-toast";
import { Hash, Address } from "viem";
import { WriteContractResult } from "@wagmi/core";
import { getPublicClient } from "@wagmi/core";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAMILE_INVITES_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_FAMILE_INVITES_ADDRESS is not defined");
}

interface InviteData {
  from: string;
  to: string;
  giftId: string;
  role: string;
  createdAt: bigint;
  expiresAt: bigint;
  accepted: boolean;
  cancelled: boolean;
}

export function useFamileInvites() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const publicClient = getPublicClient();

  // Contract read functions
  const { data: isEditor } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FamileInvites__factory.abi,
    functionName: "isEditor",
    args: [address as Address, "0x0000000000000000000000000000000000000000"],
    enabled: !!address,
  });

  // Contract write functions
  const { writeAsync: createInvite, data: createInviteData } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FamileInvites__factory.abi,
    functionName: "createInvite",
  });

  const { writeAsync: acceptInvite, data: acceptInviteData } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FamileInvites__factory.abi,
    functionName: "acceptInvite",
  });

  const { writeAsync: cancelInvite, data: cancelInviteData } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FamileInvites__factory.abi,
    functionName: "cancelInvite",
  });

  // Wait for transactions
  const { isLoading: isCreateInviteLoading } = useWaitForTransaction({
    hash: createInviteData?.hash,
  });

  const { isLoading: isAcceptInviteLoading } = useWaitForTransaction({
    hash: acceptInviteData?.hash,
  });

  const { isLoading: isCancelInviteLoading } = useWaitForTransaction({
    hash: cancelInviteData?.hash,
  });

  // Helper functions
  const handleCreateInvite = useCallback(
    async (to: string, giftId: string, role: "editor" | "viewer", expiresIn: number) => {
      try {
        setLoading(true);
        const tx = await createInvite({
          args: [to as `0x${string}`, giftId, role, BigInt(expiresIn)],
        });

        toast({
          title: "Creating Invite",
          description: "Please wait while we create your invite...",
        });

        if (tx.hash) {
          await publicClient.waitForTransactionReceipt({ hash: tx.hash });
          
          toast({
            title: "Invite Created",
            description: `Successfully created invite for ${to}`,
          });
        }
      } catch (error) {
        console.error("Error creating invite:", error);
        toast({
          title: "Error",
          description: "Failed to create invite. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [createInvite, toast, publicClient]
  );

  const handleAcceptInvite = useCallback(
    async (inviteId: Hash) => {
      try {
        setLoading(true);
        const tx = await acceptInvite({
          args: [inviteId],
        });

        toast({
          title: "Accepting Invite",
          description: "Please wait while we accept your invite...",
        });

        if (tx.hash) {
          await publicClient.waitForTransactionReceipt({ hash: tx.hash });
          
          toast({
            title: "Invite Accepted",
            description: "Successfully accepted the invite",
          });
        }
      } catch (error) {
        console.error("Error accepting invite:", error);
        toast({
          title: "Error",
          description: "Failed to accept invite. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [acceptInvite, toast, publicClient]
  );

  const handleCancelInvite = useCallback(
    async (inviteId: Hash) => {
      try {
        setLoading(true);
        const tx = await cancelInvite({
          args: [inviteId],
        });

        toast({
          title: "Cancelling Invite",
          description: "Please wait while we cancel your invite...",
        });

        if (tx.hash) {
          await publicClient.waitForTransactionReceipt({ hash: tx.hash });
          
          toast({
            title: "Invite Cancelled",
            description: "Successfully cancelled the invite",
          });
        }
      } catch (error) {
        console.error("Error cancelling invite:", error);
        toast({
          title: "Error",
          description: "Failed to cancel invite. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [cancelInvite, toast, publicClient]
  );

  return {
    loading: loading || isCreateInviteLoading || isAcceptInviteLoading || isCancelInviteLoading,
    isEditor,
    createInvite: handleCreateInvite,
    acceptInvite: handleAcceptInvite,
    cancelInvite: handleCancelInvite,
  };
} 