import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
});

export interface PinataGroup {
  id: string;
  name: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export async function createGroup(name: string) {
  try {
    return await pinata.groups.create({
      name,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
}
