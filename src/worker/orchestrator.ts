import { ethers } from "ethers";
import { TransactionExecutor } from "../core/executor";
import { ProviderManager } from "../core/provider";
import { NonceManager } from "../core/nonce-manager";
import { Worker } from "./worker";
import type { TestConfiguration, WorkerResult } from "../types";

export class WorkerOrchestrator {
  private workers: Worker[] = [];
  private config: TestConfiguration;
  private nonceManager!: NonceManager;

  constructor(config: TestConfiguration) {
    this.config = config;
  }

  async run(): Promise<void> {
    await this.initialize();
    const results = await this.startWorkers();
    this.displayResults(results);
    await this.cleanup();
  }

  private async initialize(): Promise<void> {
    const wallet = new ethers.Wallet(this.config.privateKey);

    console.info(`🚀 Starting EVM transaction test with configuration:
    Duration: ${this.config.duration} seconds
    Transaction Type: ${this.config.txType}
    RPC Endpoint: ${this.config.rpc}
    Concurrency: ${this.config.concurrency}
    From: ${wallet.address}
    To: ${this.config.recipient}
  `);

    // Initialize shared nonce manager and validate transaction type
    try {
      const providerManager = new ProviderManager(this.config.rpc);
      const tempWallet = new ethers.Wallet(this.config.privateKey, providerManager.getProvider());

      // Use real-time nonce fetching to bypass cache
      const provider = providerManager.getProvider();
      const realTimeNonce = await provider.getTransactionCount(tempWallet.address, "pending");

      this.nonceManager = new NonceManager(realTimeNonce);

      const executor = new TransactionExecutor(
        this.config.privateKey,
        providerManager,
        this.config.recipient,
        this.nonceManager
      );
      await executor.validateTransactionType(this.config.txType);

      console.log(`📊 Starting with base nonce: ${realTimeNonce}`);
    } catch (error: any) {
      console.error(error.message);
      process.exit(1);
    }
  }

  private async startWorkers(): Promise<WorkerResult[]> {
    const endTime = Date.now() + this.config.duration * 1000;

    // Get fresh real-time nonce right before starting workers
    const providerManager = new ProviderManager(this.config.rpc);
    const freshWallet = new ethers.Wallet(this.config.privateKey, providerManager.getProvider());
    const provider = providerManager.getProvider();

    const realTimeFreshNonce = await provider.getTransactionCount(freshWallet.address, "pending");
    console.log(
      `🔄 Refreshed nonce from ${this.nonceManager.getCurrentNonce()} to ${realTimeFreshNonce}`
    );

    this.nonceManager.reset(realTimeFreshNonce);

    // Create worker configurations with shared nonce manager
    const workerConfigs = Array.from({ length: this.config.concurrency }, (_, i) => ({
      id: i + 1,
      config: this.config,
      endTime,
      nonceManager: this.nonceManager
    }));

    // Create worker instances
    this.workers = workerConfigs.map((workerConfig) => new Worker(workerConfig));

    // Initialize all workers
    await Promise.all(this.workers.map((worker) => worker.initialize()));

    // Run all workers in parallel
    return Promise.all(this.workers.map((worker) => worker.run()));
  }

  private displayResults(results: WorkerResult[]): void {
    const totalTransactions = results.reduce((sum, result) => sum + result.transactionCount, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

    // Calculate timing statistics across all workers
    const allTimings = results.flatMap((result) => result.transactionTimings);
    const confirmedTimings = allTimings.filter((t) => t.finalizationTime !== undefined);

    console.log(
      `\nDone! Sent ${totalTransactions} transactions across ${this.config.concurrency} workers.`
    );

    if (totalErrors > 0) {
      console.log(`Total errors: ${totalErrors}`);
    }

    // Display timing statistics
    if (confirmedTimings.length > 0) {
      const times = confirmedTimings.map((t) => t.finalizationTime!);
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const unconfirmed = allTimings.length - confirmedTimings.length;

      console.log(`\n📊 Transaction Timing Statistics:`);
      console.log(`  Confirmed: ${confirmedTimings.length}/${allTimings.length} transactions`);
      if (unconfirmed > 0) {
        console.log(`  Unconfirmed: ${unconfirmed} transactions`);
      }
      console.log(`  Average finalization time: ${avgTime.toFixed(0)}ms`);
      console.log(`  Min finalization time: ${minTime}ms`);
      console.log(`  Max finalization time: ${maxTime}ms`);
    }
  }

  getWorkersStatus() {
    return this.workers.map((worker) => worker.getStatus());
  }

  async connectWorkersToWebSocket(wsUrl: string): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.connectWebSocket(wsUrl)));
    console.log("🔗 All workers connected to WebSocket");
  }

  async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up workers...");
    await Promise.all(this.workers.map((worker) => worker.cleanup()));
  }
}

export async function runTransactionTest(config: TestConfiguration): Promise<void> {
  const orchestrator = new WorkerOrchestrator(config);
  await orchestrator.run();
}
