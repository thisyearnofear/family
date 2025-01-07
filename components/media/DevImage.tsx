interface DevImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
}

const DevImage: React.FC<DevImageProps> = ({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  onLoad,
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? "100%" : width}
      height={fill ? "100%" : height}
      className={`${className} ${fill ? "w-full h-full object-cover" : ""}`}
      onLoad={onLoad}
      style={fill ? { position: "absolute", inset: 0 } : undefined}
    />
  );
};

export default DevImage;
