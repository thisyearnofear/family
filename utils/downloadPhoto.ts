export default function downloadPhoto(url: string, filename?: string) {
  // If no filename provided, generate one from the IPFS hash
  const defaultFilename = url.split("/").pop() || "photo.jpg";
  const finalFilename = filename || defaultFilename;

  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      // Create a blob URL for the photo
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = finalFilename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch((error) => {
      console.error("Error downloading photo:", error);
    });
}
