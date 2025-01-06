import type { NextApiRequest, NextApiResponse } from "next";

// Get environment variables with fallbacks
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!PINATA_JWT || !PINATA_GATEWAY) {
    console.error("❌ Missing Pinata configuration:", {
      hasJWT: !!PINATA_JWT,
      hasGateway: !!PINATA_GATEWAY,
    });
    return res.status(500).json({ message: "Server configuration error" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { cid } = req.query;

  if (!cid || typeof cid !== "string") {
    return res.status(400).json({ message: "Missing CID parameter" });
  }

  try {
    // Try different gateways if one fails
    const gateways = [
      `${PINATA_GATEWAY}/ipfs`,
      "https://ipfs.io/ipfs",
      "https://cloudflare-ipfs.com/ipfs",
    ];

    let lastError;
    for (const gateway of gateways) {
      try {
        console.log(`🌐 Trying gateway: ${gateway} for CID: ${cid}`);
        const response = await fetch(`${gateway}/${cid}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(
              `⚠️ Rate limited on ${gateway}, trying next gateway...`
            );
            continue;
          }
          const errorText = await response.text();
          console.error(`❌ Gateway ${gateway} error:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log(`✅ Successfully fetched metadata from ${gateway}`);
        return res.status(200).json(data);
      } catch (error) {
        console.error(`❌ Failed to fetch from ${gateway}:`, error);
        lastError = error;
      }
    }

    console.error("❌ All gateways failed:", lastError);
    throw lastError || new Error("Failed to fetch metadata from all gateways");
  } catch (error) {
    console.error("❌ Error in metadata endpoint:", error);
    return res.status(500).json({
      message: "Failed to fetch metadata",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
