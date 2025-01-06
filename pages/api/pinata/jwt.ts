import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    return res.status(500).json({ message: "Pinata JWT not configured" });
  }

  res.status(200).json({ jwt });
}
