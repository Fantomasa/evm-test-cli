import { TransactionType } from "../types";

export const DEFAULT_GAS_LIMITS = {
  [TransactionType.LEGACY]: 21_000n,
  [TransactionType.EIP1559]: 21_000n,
  [TransactionType.BLOB]: 50_000n
} as const;

export const DEFAULT_VALUES = {
  TRANSFER_AMOUNT: 1n,
  WORKER_DELAY: 1000, // ms
  RETRY_DELAY: 100, // ms
  DEFAULT_DURATION: 30, // seconds
  DEFAULT_CONCURRENCY: 1
} as const;

export const TRANSACTION_TYPES = {
  LEGACY: 0,
  EIP1559: 2,
  BLOB: 3
} as const;

export const BLOB_CONFIG = {
  DUMMY_BLOB_DATA: new Uint8Array([1, 2, 3])
} as const;
