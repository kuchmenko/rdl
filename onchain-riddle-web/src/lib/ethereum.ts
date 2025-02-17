"use client";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  getContract,
} from "viem";
import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";
import OnchainRiddle from "./contracts/OnchainRiddle";

export const ONCHAIN_RIDDLE_CONTRACT_ABI = OnchainRiddle.abi;
export const CONTRACT_ADDRESS = getAddress(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
);

// Create wagmi config
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [injected(), metaMask()],
});

// Create a public client using the provided RPC URL
export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
});

// Only create the wallet client if we are in a browser (i.e. window is defined)
const ethereumProvider =
  typeof window !== "undefined" && window.ethereum
    ? window.ethereum
    : undefined;

export const walletClient = ethereumProvider
  ? createWalletClient({
      chain: base,
      transport: custom(ethereumProvider),
    })
  : null;

// Create a reusable contract instance. When walletClient is unavailable (e.g. during SSR),
// we fallback to publicClient for both read and write operations.
export const OnchainRiddleContract = getContract({
  address: getAddress(CONTRACT_ADDRESS),
  abi: ONCHAIN_RIDDLE_CONTRACT_ABI,
  client: {
    public: publicClient,
    wallet: walletClient || publicClient,
  },
});
