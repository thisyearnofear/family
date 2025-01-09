import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

// Get environment variables with fallbacks
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

// Helper function to convert ReadableStream to AsyncIterable
async function* streamToAsyncIterable(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the content type from the response
        const contentType = response.headers.get("content-type");
        console.log(`✅ Successfully fetched image from ${gateway}`);

        // Set response headers
        res.setHeader("Content-Type", contentType || "image/*");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

        // Convert ReadableStream to Node.js Readable stream
        const stream = response.body;
        if (!stream) {
          throw new Error("No response body");
        }

        // Create a Node.js Readable stream from the response body
        const readable = Readable.from(streamToAsyncIterable(stream));

        // Pipe the response stream directly to the client
        readable.pipe(res);
        return;
      } catch (error) {
        console.error(`❌ Failed to fetch from ${gateway}:`, error);
        lastError = error;
      }
    }

    console.error("❌ All gateways failed:", lastError);
    throw lastError || new Error("Failed to fetch image from all gateways");
  } catch (error) {
    console.error("❌ Error in image endpoint:", error);
    return res.status(500).json({
      message: "Failed to fetch image",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
