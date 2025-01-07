import { useState, useEffect } from "react";

interface NameServiceResponse {
  address: string;
  identity: string;
  platform: string;
  displayName: string;
  avatar: string | null;
  description: string | null;
}

export function useNameService(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [lensName, setLensName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNames() {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch ENS name
        const ensResponse = await fetch(
          `https://api.web3.bio/ns/ens/${address}`
        );
        if (ensResponse.ok) {
          const ensData: NameServiceResponse = await ensResponse.json();
          setEnsName(ensData.identity || null);
        }

        // Fetch Lens name
        const lensResponse = await fetch(
          `https://api.web3.bio/ns/lens/${address}`
        );
        if (lensResponse.ok) {
          const lensData: NameServiceResponse = await lensResponse.json();
          setLensName(lensData.identity || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch names");
      } finally {
        setLoading(false);
      }
    }

    fetchNames();
  }, [address]);

  return {
    ensName,
    lensName,
    loading,
    error,
    displayName: ensName || lensName || address,
  };
}
