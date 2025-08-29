import { TransactionExecutor } from "../core/executor";
import { ProviderManager } from "../core/provider";
import type { WorkerConfig, WorkerResult, TestConfiguration, WorkerStatus } from "../types";
import { DEFAULT_VALUES } from "../utils/constants";
import type { NonceManager } from "../core/nonce-manager";

export class Worker {
  private readonly id: number;
  private readonly config: TestConfiguration;
  private readonly nonceManager: NonceManager;
  private readonly endTime: number;

  private executor!: TransactionExecutor;
  private transactionCount = 0;
  private errors: string[] = [];

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

        this.transactionCount++;
        console.log(`Worker (${this.id}): ${tx.hash} finished in ${(duration / 1000).toFixed(2)}s`);

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

    return this.getResult();
  }

  getResult(): WorkerResult {
    return {
      workerId: this.id,
      transactionCount: this.transactionCount,
      errors: [...this.errors]
    };
  }

  getStatus(): WorkerStatus {
    return {
      id: this.id,
      transactionCount: this.transactionCount,
      errorCount: this.errors.length
    };
  }

  // Future extension point for WebSocket connections
  async connectWebSocket(wsUrl: string): Promise<void> {
    // TODO: Implement WebSocket connection for real-time events
    console.log(`Worker (${this.id}) connecting to WebSocket: ${wsUrl}`);
  }
}
