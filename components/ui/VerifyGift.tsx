import React, { useEffect, useState } from "react";
import { PinataClient } from "../../scripts/pinata-client";

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

if (!PINATA_GATEWAY) {
  throw new Error("Missing Pinata Gateway configuration");
}

// Now we know this is defined
const pinataGateway: string = PINATA_GATEWAY;

interface VerifyGiftProps {
  giftId: string;
  onVerified: () => void;
  onError: (error: Error) => void;
}

export function VerifyGift({ giftId, onVerified, onError }: VerifyGiftProps) {
  const [status, setStatus] = useState<"verifying" | "complete" | "error">(
    "verifying"
  );
  const [progress, setProgress] = useState({ found: 0, total: 0 });

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const verifyGift = async () => {
      try {
        // Get the JWT from our API
        const jwtResponse = await fetch("/api/pinata/jwt");
        if (!jwtResponse.ok) {
          throw new Error("Failed to get Pinata JWT");
        }
        const { jwt } = await jwtResponse.json();

        const pinata = new PinataClient(jwt, pinataGateway);

        // Find all files for this gift
        const giftFiles = await pinata.pinList({
          metadata: {
            keyvalues: {
              giftId: {
                value: giftId,
                op: "eq",
              },
            },
          },
        });

        // First, find the metadata file
        const metadataFile = giftFiles.rows.find(
          (file) => file.metadata?.keyvalues?.type === "metadata"
        );

        if (!metadataFile) {
          throw new Error("Gift metadata not found");
        }

        // Get the metadata content
        const metadataResponse = await fetch(
          `${pinataGateway}/ipfs/${metadataFile.ipfs_pin_hash}`
        );
        const metadata = await metadataResponse.json();

        // Get the expected number of files (images + metadata)
        const expectedTotal = metadata.images.length + 1;

        // Check if all files are present
        const foundFiles = giftFiles.rows.length;
        setProgress({ found: foundFiles, total: expectedTotal });

        if (foundFiles === expectedTotal) {
          setStatus("complete");
          onVerified();
        } else {
          // Not all files are present yet
          setStatus("verifying");

          // Set up polling to check again
          checkInterval = setInterval(async () => {
            const updatedFiles = await pinata.pinList({
              metadata: {
                keyvalues: {
                  giftId: {
                    value: giftId,
                    op: "eq",
                  },
                },
              },
            });

            const newFoundFiles = updatedFiles.rows.length;
            setProgress({ found: newFoundFiles, total: expectedTotal });

            if (newFoundFiles === expectedTotal) {
              clearInterval(checkInterval);
              setStatus("complete");
              onVerified();
            }
          }, 5000);
        }
      } catch (error) {
        setStatus("error");
        onError(
          error instanceof Error ? error : new Error("Verification failed")
        );
      }
    };

    verifyGift();

    // Cleanup interval on unmount
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [giftId, onVerified, onError]);

  // Separate effect for timeout
  useEffect(() => {
    if (status !== "verifying") return;

    const timeoutId = setTimeout(() => {
      if (status === "verifying") {
        setStatus("error");
        onError(new Error("Verification timed out"));
      }
    }, 2 * 60 * 1000);

    return () => clearTimeout(timeoutId);
  }, [status, onError]);

  return (
    <div className="verify-gift">
      {status === "verifying" && (
        <div className="verification-progress">
          <p>Verifying gift files...</p>
          <progress value={progress.found} max={progress.total} />
          <p>
            {progress.found} of {progress.total} files verified
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="verification-error">
          <p>Failed to verify gift files. Please try again.</p>
        </div>
      )}
      <style jsx>{`
        .verify-gift {
          padding: 20px;
          text-align: center;
        }
        .verification-progress {
          margin: 20px 0;
        }
        .verification-error {
          color: red;
          margin: 20px 0;
        }
        progress {
          width: 100%;
          height: 20px;
        }
      `}</style>
    </div>
  );
}
