import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from '@utils/constants';
import { Address } from 'viem';

export interface Invite {
  id: string;
  from: string;
  to: string;
  giftId: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  accepted: boolean;
  cancelled: boolean;
}

export function useInvites(giftId: string) {
  const { address } = useAccount();
  const [invites, setInvites] = useState<{
    incoming: Invite[];
    outgoing: Invite[];
  }>({
    incoming: [],
    outgoing: [],
  });

  const { data: events } = useReadContract({
    address: FAMILE_INVITES_ADDRESS as Address,
    abi: FAMILE_INVITES_ABI,
    functionName: 'invites',
    args: [giftId],
  });

  useEffect(() => {
    if (!events || !address) return;

    // Process events into invites
    const processedInvites = (events as any[]).reduce(
      (acc, event) => {
        const invite: Invite = {
          id: event.id,
          from: event.from,
          to: event.to,
          giftId: event.giftId,
          role: event.role,
          createdAt: Number(event.createdAt),
          expiresAt: Number(event.expiresAt),
          accepted: event.accepted,
          cancelled: event.cancelled,
        };

        // Split into incoming and outgoing
        if (invite.to.toLowerCase() === address.toLowerCase()) {
          acc.incoming.push(invite);
        } else if (invite.from.toLowerCase() === address.toLowerCase()) {
          acc.outgoing.push(invite);
        }

        return acc;
      },
      { incoming: [], outgoing: [] } as { incoming: Invite[]; outgoing: Invite[] }
    );

    setInvites(processedInvites);
  }, [events, address]);

  return {
    invites,
    isLoading: !events,
  };
} 