import React from "react";
import Gallery from "react-photo-gallery";
import type { ImageProps } from "../utils/types";

interface CollageProps {
  images: ImageProps[];
}

const Collage: React.FC<CollageProps> = ({ images }) => {
  // Transform images to the format required by react-photo-gallery
  const photos = images.map((image) => ({
    src: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`,
    width: image.width || 4,
    height: image.height || 3,
  }));

  return (
    <div className="collage-container">
      <Gallery photos={photos} direction="column" />
    </div>
  );
};

export default Collage;
