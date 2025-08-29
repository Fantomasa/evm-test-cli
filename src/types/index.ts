import type { NonceManager } from "../core/nonce-manager";

export enum TransactionType {
  LEGACY = "legacy",
  EIP1559 = "eip1559",
  BLOB = "blob"
}

export interface TestConfiguration {
  duration: number;
  txType: TransactionType;
  rpc: string;
  privateKey: string;
  recipient: string;
  concurrency: number;
}

export interface TransactionTiming {
  hash: string;
  sentAt: Date;
  confirmedAt?: Date;
  finalizationTime?: number; // milliseconds
  blockNumber?: number;
}

export interface WorkerResult {
  workerId: number;
  transactionCount: number;
  errors: string[];
  transactionTimings: TransactionTiming[];
  averageFinalizationTime?: number;
  minFinalizationTime?: number;
  maxFinalizationTime?: number;
}

export interface WorkerConfig {
  id: number;
  config: TestConfiguration;
  endTime: number;
  nonceManager: NonceManager;
}

export interface NonceInfo {
  baseNonce: number | null;
  currentCounter: number;
}

export interface ChainInfo {
  chainId: bigint;
  supportsBlobTx: boolean;
}

export interface WorkerStatus {
  id: number;
  transactionCount: number;
  errorCount: number;
}
