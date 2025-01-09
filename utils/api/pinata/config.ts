export const pinataConfig = {
  apiUrl: 'https://api.pinata.cloud',
  gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  jwt: process.env.NEXT_PUBLIC_PINATA_JWT || '',
}; 