export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate new dimensions (max 1600px width/height)
      let width = img.width;
      let height = img.height;
      const maxDimension = 1600;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: file.lastModified,
                })
              );
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          0.8
        );
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
  });
}

export async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate thumbnail dimensions (max 200px width/height)
      let width = img.width;
      let height = img.height;
      const maxDimension = 200;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.5);
        resolve(thumbnail);
      } else {
        reject(new Error("Failed to create thumbnail"));
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
  });
}

interface ExifData {
  dateTaken?: string;
}

export async function extractExifData(
  arrayBuffer: ArrayBuffer
): Promise<ExifData> {
  // For now, just return the current date since we don't have EXIF parsing implemented
  return {
    dateTaken: new Date().toISOString(),
  };
}
