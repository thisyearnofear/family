import { useState, useEffect } from "react";

export interface Web3BioProfile {
  address: string;
  identity: string;
  platform: string;
  displayName: string;
  avatar: string;
  description: string | null;
}

export function useWeb3Bio(input: string) {
  const [profile, setProfile] = useState<Web3BioProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!input || input.length < 3) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try Lens resolution first if it's a Lens handle
        if (input.endsWith(".lens") || input.includes("@")) {
          const cleanHandle = input.replace("@", "").replace(".lens", "");
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
        if (input.includes(".eth")) {
          const ensResponse = await fetch(
            `https://api.web3.bio/profile/ens/${input}`
          );
          if (ensResponse.ok) {
            const data = await ensResponse.json();
            setProfile(data);
            return;
          }
        }

        // If specific resolutions fail, try universal profile lookup
        const universalResponse = await fetch(
          `https://api.web3.bio/profile/${input}`
        );
        if (universalResponse.ok) {
          const data = await universalResponse.json();
          if (Array.isArray(data) && data.length > 0) {
            // Find the first profile that matches the platform we're looking for
            const matchingProfile = data.find(
              (p) =>
                (input.endsWith(".lens") && p.platform === "lens") ||
                (input.endsWith(".eth") && p.platform === "ens") ||
                p.platform === "ens" // Default to ENS if no specific match
            );
            setProfile(matchingProfile || data[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProfile, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [input]);

  return { profile, isLoading, error };
}
