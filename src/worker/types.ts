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
