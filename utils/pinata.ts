import PinataSDK from "@pinata/sdk";

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

export interface IPFSImage {
  id: number;
  ipfsHash: string;
  name: string;
  width: number;
  height: number;
}

interface PinataMetadata {
  name?: string;
}

interface PinataPin {
  ipfs_pin_hash: string;
  metadata: PinataMetadata;
}

export async function uploadToPinata(file: Buffer, fileName: string) {
  try {
    const result = await pinata.pinFileToIPFS(file, {
      pinataMetadata: {
        name: fileName,
      },
    });
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}

export async function getImages(): Promise<IPFSImage[]> {
  try {
    const result = await pinata.pinList({
      status: "pinned",
    });

    return result.rows
      .filter((pin: PinataPin) => {
        const name = pin.metadata?.name;
        return typeof name === "string" && /\.(jpg|jpeg|png|gif)$/i.test(name);
      })
      .map(
        (pin: PinataPin, index: number): IPFSImage => ({
          id: index,
          ipfsHash: pin.ipfs_pin_hash,
          name: pin.metadata?.name ?? `Image ${index.toString()}`,
          width: 1280,
          height: 720,
        })
      );
  } catch (error) {
    console.error("Error fetching from Pinata:", error);
    throw error;
  }
}
