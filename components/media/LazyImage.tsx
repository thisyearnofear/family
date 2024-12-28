import Image from "next/image";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  priority = false,
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
  onLoad,
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      onLoad={onLoad}
    />
  );
};

export default LazyImage;
