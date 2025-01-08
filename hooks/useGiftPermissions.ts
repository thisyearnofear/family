import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getImages } from '@utils/api/pinata';
import type { CollaborativeGift } from '@utils/types/collaborative';

export function useGiftPermissions(giftId: string | undefined, shouldCheck: boolean = false) {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gift, setGift] = useState<CollaborativeGift | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'editor' | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Only check permissions if shouldCheck is true
  useEffect(() => {
    if (!shouldCheck || !giftId || !isConnected || !address) {
      return;
    }

    const checkPermissions = async () => {
      setLoading(true);
      try {
        // TODO: Check contract for permissions
        // For now, just simulate a check
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserRole('owner');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check permissions'));
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [giftId, address, isConnected, shouldCheck]);

  const loadGiftMetadata = async () => {
    if (!giftId) return;

    setIsLoadingMetadata(true);
    try {
      const data = await getImages({
        groupId: giftId,
        hasFiles: true,
        hasIpfs: false,
        isDemo: false,
      });

      setGift({
        giftId,
        title: data.title || '',
        theme: data.theme as 'space' | 'japanese',
        photos: data.images,
        messages: data.messages || [],
        music: data.music || [],
        owner: '', // TODO: Get from contract
        editors: [], // TODO: Get from contract
        version: 1,
        lastModified: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load gift metadata'));
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  return {
    loading,
    error,
    gift,
    userRole,
    isConnected,
    isLoadingMetadata,
    loadGiftMetadata,
  };
} 