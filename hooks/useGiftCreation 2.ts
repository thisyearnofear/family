import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWatchContractEvent } from "wagmi";
import type { Hash } from "viem";
import { createGift } from "@utils/api/pinata";
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from "@utils/constants";
import type { Photo } from "@utils/types/types";

export interface GiftCreationStatus {
  giftId: string | null;
  isUploading: boolean;
  error: string | null;
  progress: number;
  status: "uploading" | "verifying" | "ready" | "pending" | "error";
}

export interface TransactionStatus {
  isConfirming: boolean;
  isConfirmed: boolean;
  hash?: string;
}

export function useGiftCreation() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<GiftCreationStatus>({
    giftId: null,
    isUploading: false,
    error: null,
    progress: 0,
    status: "uploading",
  });
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    isConfirming: false,
    isConfirmed: false,
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess: (hash: Hash) => {
        setTxStatus((prev) => ({
          ...prev,
          isConfirming: true,
          hash,
        }));
      },
    },
  });

  useWatchContractEvent({
    address: FAMILE_INVITES_ADDRESS,
    abi: FAMILE_INVITES_ABI,
    eventName: "GiftOwnerSet",
    onLogs(logs) {
      setTxStatus((prev) => ({
        ...prev,
        isConfirming: false,
        isConfirmed: true,
      }));
      console.log("Gift ownership confirmed on-chain", logs);
    },
  });

  const createNewGift = useCallback(
    async ({
      photos,
      theme,
      messages,
      selectedSongs,
      title,
      customDates,
    }: {
      photos: Photo[];
      theme: "space" | "japanese";
      messages: string[];
      selectedSongs: string[];
      title: string;
      customDates: Record<string, string>;
    }) => {
      setStatus((prev) => ({
        ...prev,
        isUploading: true,
        error: null,
        progress: 0,
        status: "uploading",
      }));

      try {
        const result = await createGift(
          photos.map((p) => p.file),
          theme,
          messages,
          selectedSongs,
          title,
          customDates,
          isConnected ? address : undefined
        );

        setStatus((prev) => ({
          ...prev,
          giftId: result.giftId,
          progress: 100,
          status: "ready",
        }));

        return result;
      } catch (error) {
        console.error("Error creating gift:", error);
        setStatus((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to create gift",
          status: "error",
        }));
        throw error;
      }
    },
    [address, isConnected]
  );

  const registerGiftOnChain = useCallback(
    async (giftId: string) => {
      try {
        await writeContract({
          address: FAMILE_INVITES_ADDRESS as `0x${string}`,
          abi: FAMILE_INVITES_ABI,
          functionName: "setGiftOwner",
          args: [giftId, address as `0x${string}`],
        });
      } catch (error) {
        console.error("Error registering gift on-chain:", error);
        throw error;
      }
    },
    [address, writeContract]
  );

  return {
    status,
    txStatus,
    createNewGift,
    registerGiftOnChain,
  };
}
