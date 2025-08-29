import { TransactionExecutor } from "../core/executor";
import { ProviderManager } from "../core/provider";
import type {
  WorkerConfig,
  WorkerResult,
  TestConfiguration,
  WorkerStatus,
  TransactionTiming
} from "../types";
import { DEFAULT_VALUES } from "../utils/constants";
import type { NonceManager } from "../core/nonce-manager";
import type { TransactionResponse } from "ethers";

export class Worker {
  private readonly id: number;
  private readonly config: TestConfiguration;
  private readonly nonceManager: NonceManager;
  private readonly endTime: number;

  private executor!: TransactionExecutor;
  private transactionCount = 0;
  private errors: string[] = [];
  private transactionTimings: TransactionTiming[] = [];
  private pendingTransactions: Map<string, TransactionTiming> = new Map();

  constructor(config: WorkerConfig) {
    this.id = config.id;
    this.config = config.config;
    this.nonceManager = config.nonceManager;
    this.endTime = config.endTime;
  }

  async initialize(): Promise<void> {
    const providerManager = new ProviderManager(this.config.rpc);
    this.executor = new TransactionExecutor(
      this.config.privateKey,
      providerManager,
      this.config.recipient,
      this.nonceManager
    );

    await this.executor.initialize();

    // Start listening for transaction confirmations
    this.startTransactionListener();
  }

  private startTransactionListener(): void {
    const provider = this.executor.getProvider();

    // Listen for new blocks to check transaction confirmations
    provider.on("block", async (blockNumber: number) => {
      await this.checkPendingTransactions(blockNumber);
    });
  }

  private async checkPendingTransactions(blockNumber: number): Promise<void> {
    const provider = this.executor.getProvider();

    for (const [hash, timing] of this.pendingTransactions.entries()) {
      try {
        const receipt = await provider.getTransactionReceipt(hash);

        if (receipt && receipt.blockNumber) {
          // Transaction confirmed!
          const confirmedAt = new Date();
          const finalizationTime = confirmedAt.getTime() - timing.sentAt.getTime();

          const completedTiming: TransactionTiming = {
            ...timing,
            confirmedAt,
            finalizationTime,
            blockNumber: receipt.blockNumber
          };

          this.transactionTimings.push(completedTiming);
          this.pendingTransactions.delete(hash);

          console.log(
            `Worker (${this.id}): Transaction ${hash} confirmed in ${finalizationTime}ms (block ${receipt.blockNumber})`
          );
        }
      } catch (error) {
        // Transaction receipt not yet available, continue waiting
      }
    }
  }

  async run(): Promise<WorkerResult> {
    if (!this.executor) {
      await this.initialize();
    }

    // Worker initialized and ready

    while (Date.now() < this.endTime) {
      try {
        const txStartTime = Date.now();
        const tx = await this.executor.sendTransaction(this.config.txType);
        const txEndTime = Date.now();
        const duration = txEndTime - txStartTime;

        // Track transaction timing
        const sentAt = new Date();
        const timing: TransactionTiming = {
          hash: tx.hash,
          sentAt
        };

        this.pendingTransactions.set(tx.hash, timing);
        this.transactionCount++;

        console.log(`Worker (${this.id}): ${tx.hash} sent in ${(duration / 1000).toFixed(2)}s`);

        // Continue processing transactions
        await new Promise((resolve) => setTimeout(resolve, DEFAULT_VALUES.WORKER_DELAY));
      } catch (error: any) {
        const errorMessage = `tx failed - ${error.message}`;
        console.error(`Worker (${this.id}): ${errorMessage}`);
        this.errors.push(errorMessage);

        // Check if this is a nonce error - if so, recover and retry
        if (error.code === "NONCE_EXPIRED" || error.message.includes("nonce")) {
          console.warn(`⚠️  Worker (${this.id}): NONCE CONFLICT - attempting recovery`);

          // Attempt to recover from nonce error
          try {
            await this.executor.recoverFromNonceError();
            console.log(`✅ Worker (${this.id}): Nonce recovery completed, continuing...`);

            // Skip the delay and continue immediately after recovery
            continue;
          } catch (recoveryError: any) {
            console.error(
              `❌ Worker (${this.id}): Nonce recovery failed: ${recoveryError.message}`
            );
          }
        }

        // Add small delay to avoid rapid retries
        await new Promise((resolve) => setTimeout(resolve, DEFAULT_VALUES.RETRY_DELAY));
      }
    }

    // Wait a bit more for final confirmations
    console.log(`Worker (${this.id}): Waiting for final transaction confirmations...`);
    await this.waitForFinalConfirmations();

    return this.getResult();
  }

  private async waitForFinalConfirmations(maxWaitTime: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (this.pendingTransactions.size > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // The block listener will handle confirmations
      console.log(
        `Worker (${this.id}): Still waiting for ${this.pendingTransactions.size} confirmations...`
      );
    }

    // Mark any remaining transactions as unconfirmed
    for (const [hash, timing] of this.pendingTransactions.entries()) {
      this.transactionTimings.push({
        ...timing,
        finalizationTime: undefined // Unconfirmed
      });
    }
    this.pendingTransactions.clear();
  }

  private calculateTimingStats(): { average?: number; min?: number; max?: number } {
    const confirmedTimings = this.transactionTimings
      .filter((t) => t.finalizationTime !== undefined)
      .map((t) => t.finalizationTime!);

    if (confirmedTimings.length === 0) {
      return {};
    }

    const average = confirmedTimings.reduce((sum, time) => sum + time, 0) / confirmedTimings.length;
    const min = Math.min(...confirmedTimings);
    const max = Math.max(...confirmedTimings);

    return { average, min, max };
  }

  getResult(): WorkerResult {
    const stats = this.calculateTimingStats();

    return {
      workerId: this.id,
      transactionCount: this.transactionCount,
      errors: [...this.errors],
      transactionTimings: [...this.transactionTimings],
      averageFinalizationTime: stats.average,
      minFinalizationTime: stats.min,
      maxFinalizationTime: stats.max
    };
  }

  getStatus(): WorkerStatus {
    return {
      id: this.id,
      transactionCount: this.transactionCount,
      errorCount: this.errors.length
    };
  }

  // Clean up event listeners
  async cleanup(): Promise<void> {
    const provider = this.executor.getProvider();
    provider.removeAllListeners("block");
  }

  // Future extension point for WebSocket connections
  async connectWebSocket(wsUrl: string): Promise<void> {
    // TODO: Implement WebSocket connection for real-time events
    console.log(`Worker (${this.id}) connecting to WebSocket: ${wsUrl}`);
  }
}
