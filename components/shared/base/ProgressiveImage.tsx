import React, { useState, useEffect } from "react";
import Image from "next/image";

interface BaseProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
}

export function BaseProgressiveImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = "",
  quality = 75,
  placeholder = "blur",
  blurDataURL,
  onLoad,
}: BaseProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lowQualitySrc, setLowQualitySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!blurDataURL) {
      // Create a low quality placeholder
      const img = new window.Image(width, height);
      img.src = src;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = img.width / 10;
        canvas.height = img.height / 10;
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setLowQualitySrc(canvas.toDataURL("image/jpeg", 0.1));
        }
      };
    }
  }, [src, blurDataURL, width, height]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {(lowQualitySrc || blurDataURL) && isLoading && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-lg transform scale-105 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${blurDataURL || lowQualitySrc})`,
            opacity: isLoading ? 1 : 0,
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={handleLoad}
        placeholder={placeholder}
        blurDataURL={blurDataURL || lowQualitySrc || undefined}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
