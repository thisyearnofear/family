import { testImageDates } from "../utils/uploadImages.mts";

const directoryPath = process.argv[2] || "./images";

console.log(`Testing images in directory: ${directoryPath}`);
testImageDates(directoryPath)
  .then(() => console.log("\nDate testing complete!"))
  .catch((error) => {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
  });
