import { Chain } from "viem";

export const SONGS = [
  { path: "/sounds/background-music.mp3", title: "Hopes and Dreams" },
  { path: "/sounds/grow-old.mp3", title: "Grow Old Together" },
  { path: "/sounds/mama.mp3", title: "Mamamayako" },
  { path: "/sounds/baba.mp3", title: "Baba, I Understand" },
] as const;

export type Song = (typeof SONGS)[number];

export const FAMILE_INVITES_ADDRESS =
  "0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2" as `0x${string}`;

export const FAMILE_INVITES_ABI = [
  {
    name: "setGiftOwner",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "giftId", type: "string" },
      { name: "owner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "createInvite",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "giftId", type: "string" },
      { name: "role", type: "string" },
      { name: "expiresIn", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "acceptInvite",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "inviteId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "cancelInvite",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "inviteId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "removeEditor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "giftId", type: "string" },
      { name: "editor", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "InviteCreated",
    type: "event",
    inputs: [
      { name: "inviteId", type: "bytes32", indexed: true },
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "giftId", type: "string", indexed: false },
      { name: "role", type: "string", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
] as const;

export const LENS_CHAIN_ID = 37111;

export const lensChain: Chain = {
  id: LENS_CHAIN_ID,
  name: "Lens Network Sepolia Testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: "GRASS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.lens.dev"],
    },
    public: {
      http: ["https://rpc.testnet.lens.dev"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lens Block Explorer",
      url: "https://block-explorer.testnet.lens.dev",
    },
  },
  testnet: true,
};
