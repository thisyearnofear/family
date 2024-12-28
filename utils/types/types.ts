/* eslint-disable no-unused-vars */
export interface ImageProps {
  id: number;
  ipfsHash: string;
  width: number;
  height: number;
  dateModified: string; // ISO date string
  name: string;
  blurDataUrl?: string;
  description: string | null;
}

export interface SharedModalProps {
  index: number;
  images?: ImageProps[];
  currentPhoto?: ImageProps;
  changePhotoId: (newVal: number) => void;
  closeModal: () => void;
  navigation: boolean;
  direction?: number;
}
