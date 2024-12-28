export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If the src is already a full URL, return it as is
  if (src.startsWith("http")) {
    return src;
  }

  // Otherwise, construct the Pinata gateway URL
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
    "https://gateway.pinata.cloud/ipfs";
  return `${gateway}/${src}`;
}
