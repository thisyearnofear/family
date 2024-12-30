// Core Pinata API functions
export {
  pinFileToIPFS,
  createGiftGroup,
  addFilesToGroup,
  getImages,
} from "../../pinata/pinata";

// Photo upload functionality
export { uploadPhotos, validatePhotos } from "../../pinata/uploadPhotos";

// Types
export type { UploadResult } from "../../pinata/uploadPhotos";
