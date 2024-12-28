/* eslint-disable no-unused-vars */
export interface ImageProps {
  id: number;
  ipfsHash: string;
  width: number;
  height: number;
  dateTaken: string; // ISO date string
  dateModified?: string; // ISO date string (optional)
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
