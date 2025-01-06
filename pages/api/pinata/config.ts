import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Only return the gateway URL, keep JWT server-side
  res.status(200).json({
    gateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud",
  });
}
