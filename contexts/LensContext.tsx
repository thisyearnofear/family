import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import type {
  LensProfile,
  LensChallenge,
  LensAuthentication,
} from "../utils/types/lens";

interface LensContextType {
  profile: LensProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  disconnect: () => void;
}

const LensContext = createContext<LensContextType | undefined>(undefined);

export function useLens() {
  const context = useContext(LensContext);
  if (context === undefined) {
    throw new Error("useLens must be used within a LensProvider");
  }
  return context;
}

interface LensProviderProps {
  children: ReactNode;
}

export function LensProvider({ children }: LensProviderProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [profile, setProfile] = useState<LensProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTokens, setAuthTokens] = useState<LensAuthentication | null>(null);

  // Clear state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setProfile(null);
      setIsAuthenticated(false);
      setError(null);
      setAuthTokens(null);
    }
  }, [isConnected]);

  // Attempt to authenticate with Lens when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      authenticate();
    }
  }, [isConnected, address]);

  const authenticate = async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check if user has a Lens profile
      const profileResponse = await fetch(
        `https://api.web3.bio/profile/lens/${address}`
      );

      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          setError("No Lens profile found for this address");
          return;
        }
        throw new Error("Failed to fetch Lens profile");
      }

      const profileData = await profileResponse.json();

      // 2. Get authentication challenge
      const challengeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_LENS_API_URL}/challenge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        }
      );

      if (!challengeResponse.ok) {
        throw new Error("Failed to get authentication challenge");
      }

      const { challenge } = (await challengeResponse.json()) as {
        challenge: LensChallenge;
      };

      // 3. Sign the challenge with the wallet
      const signature = await signMessageAsync({
        message: challenge.text,
      });

      // 4. Verify the signature
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_LENS_API_URL}/authenticate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            signature,
            challengeId: challenge.id,
          }),
        }
      );

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify signature");
      }

      const auth = (await verifyResponse.json()) as LensAuthentication;
      setAuthTokens(auth);

      // Set authenticated state
      setProfile({
        id: profileData.id,
        handle: profileData.identity.replace(".lens", ""),
        displayName: profileData.displayName,
        avatar: profileData.avatar,
        address: profileData.address,
      });
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Error authenticating with Lens:", err);
      setError(
        err instanceof Error ? err.message : "Failed to authenticate with Lens"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setProfile(null);
    setIsAuthenticated(false);
    setError(null);
    setAuthTokens(null);
  };

  return (
    <LensContext.Provider
      value={{
        profile,
        isAuthenticated,
        isLoading,
        error,
        authenticate,
        disconnect,
      }}
    >
      {children}
    </LensContext.Provider>
  );
}
