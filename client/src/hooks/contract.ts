"use client";

import {
  Contract as StellarContract,
  rpc,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address as StellarAddress,
  xdr,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import { sorobanClient } from "@/lib/sorobanClient";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type Network = "testnet" | "mainnet";

export const NETWORKS: Record<
  Network,
  { rpc: string; passphrase: string; label: string }
> = {
  testnet: {
    rpc: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
    label: "Stellar Testnet",
  },
  mainnet: {
    rpc: "https://soroban-mainnet.stellar.org",
    passphrase: "Public Global Stellar Network ; September 2015",
    label: "Stellar Mainnet",
  },
};

export const DEFAULT_NETWORK: Network = "testnet";
export const DEFAULT_CONTRACT_ID =
  "CCW67TSB3T3BT7O32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32";

// ---------------------------------------------------------------------------
// Wallet helpers
// ---------------------------------------------------------------------------

export async function checkFreighter(): Promise<boolean> {
  return sorobanClient.checkWallet();
}

export async function connectWallet(): Promise<string | null> {
  return sorobanClient.connectWallet();
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const allowed = await isAllowed();
    if (!allowed) return null;
    const { address } = await getAddress();
    return address;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ScVal converters
// ---------------------------------------------------------------------------

export function toScValString(v: string) {
  return nativeToScVal(v, { type: "string" });
}

export function toScValAddress(v: string) {
  return new StellarAddress(v).toScVal();
}

export function toScValU32(v: number) {
  return nativeToScVal(v, { type: "u32" });
}

export function toScValI128(v: bigint | number) {
  return nativeToScVal(v.toString(), { type: "i128" });
}

// ---------------------------------------------------------------------------
// Read-only contract call (simulate)
// ---------------------------------------------------------------------------

export async function readContract(
  contractId: string,
  method: string,
  params: xdr.ScVal[] = [],
  network: Network = DEFAULT_NETWORK
): Promise<xdr.ScVal> {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.simulateRead(contractId, method, params);
}

// ---------------------------------------------------------------------------
// State-changing contract call (requires signing)
// ---------------------------------------------------------------------------

export async function callContract(
  contractId: string,
  method: string,
  params: xdr.ScVal[] = [],
  walletAddress: string,
  network: Network = DEFAULT_NETWORK
): Promise<{ txHash: string; result?: xdr.ScVal }> {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  const res = await service.prepareAndSendTransaction(
    contractId,
    method,
    params,
    walletAddress
  );
  return { txHash: res.txHash };
}

// ---------------------------------------------------------------------------
// Typed wrappers for the Voting Contract
// ---------------------------------------------------------------------------

export async function vote(
  contractId: string,
  voterAddress: string,
  candidate: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.vote(contractId, voterAddress, candidate);
}

export async function addCandidate(
  contractId: string,
  callerAddress: string,
  candidate: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.addCandidate(contractId, callerAddress, candidate);
}

export async function registerCandidate(
  contractId: string,
  callerAddress: string,
  candidate: string,
  network: Network = DEFAULT_NETWORK
) {
  return addCandidate(contractId, callerAddress, candidate, network);
}

export async function getVotes(
  contractId: string,
  candidate: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.getVotes(contractId, candidate);
}

export async function getCandidates(
  contractId: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.getCandidates(contractId);
}

export async function getOwner(
  contractId: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.getOwner(contractId);
}

export async function initContract(
  contractId: string,
  ownerAddress: string,
  network: Network = DEFAULT_NETWORK
) {
  const service = new (require("@/lib/sorobanClient").SorobanClientService)(
    network
  );
  return service.init(contractId, ownerAddress);
}
