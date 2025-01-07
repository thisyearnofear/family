import { useState, useCallback } from "react";

interface LensProfile {
  address: string;
  identity: string;
  platform: string;
  displayName: string;
  avatar: string | null;
  handle: string;
}

interface UseLensProfileReturn {
  searchProfile: (query: string) => Promise<void>;
  profile: LensProfile | null;
  isLoading: boolean;
  error: string | null;
  clearProfile: () => void;
}

export function useLensProfile(): UseLensProfileReturn {
  const [profile, setProfile] = useState<LensProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  const searchProfile = useCallback(
    async (query: string) => {
      if (!query) {
        clearProfile();
        return;
      }

      // Rate limiting: Only allow searches every 500ms
      const now = Date.now();
      if (now - lastSearchTime < 500) {
        return;
      }
      setLastSearchTime(now);

      setIsLoading(true);
      setError(null);

      try {
        // Clean up the query (remove @ if present)
        const cleanQuery = query.startsWith("@") ? query.slice(1) : query;

        // Basic validation
        if (cleanQuery.length < 3) {
          throw new Error("Search query too short");
        }

        // Determine if it's an address or handle
        const isAddress = cleanQuery.startsWith("0x");
        if (isAddress && cleanQuery.length !== 42) {
          throw new Error("Invalid Ethereum address");
        }

        // Construct the API URL
        const apiUrl = `https://api.web3.bio/profile/lens/${cleanQuery}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Lens profile not found");
          }
          if (response.status === 429) {
            throw new Error("Too many requests, please try again later");
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();

        if (!data.address || !data.identity) {
          throw new Error("Invalid profile data received");
        }

        // Transform the API response into our LensProfile format
        const profileData: LensProfile = {
          address: data.address,
          identity: data.identity,
          platform: data.platform,
          displayName: data.displayName || data.identity,
          avatar: data.avatar,
          handle: data.identity.replace(".lens", ""),
        };

        setProfile(profileData);
      } catch (err) {
        console.error("Error fetching Lens profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile"
        );
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [clearProfile, lastSearchTime]
  );

  return {
    searchProfile,
    profile,
    isLoading,
    error,
    clearProfile,
  };
}
