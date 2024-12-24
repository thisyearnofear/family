import { uploadImagesFromDirectory } from "../utils/uploadImages";

const directoryPath = process.argv[2];

if (!directoryPath) {
  console.error("Please provide the directory path as an argument");
  process.exit(1);
}

uploadImagesFromDirectory(directoryPath)
  .then(() => console.log("Upload complete!"))
  .catch(console.error);
