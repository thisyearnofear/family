import Image from "next/image";
import { useState } from "react";

interface CustomImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export default function CustomImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  onLoad,
}: CustomImageProps) {
  const [isError, setIsError] = useState(false);

  if (process.env.NODE_ENV === "development") {
    // In development, use a regular img tag to bypass domain restrictions
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={onLoad}
      />
    );
  }

  // In production, use Next.js Image component
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 1920}
      height={height || 1080}
      className={className}
      priority={priority}
      onError={() => setIsError(true)}
      onLoad={onLoad}
    />
  );
}
