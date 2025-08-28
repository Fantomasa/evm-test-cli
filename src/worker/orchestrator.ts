import { ethers } from "ethers";
import { TransactionExecutor } from "../core/executor";
import { ProviderManager } from "../core/provider";
import { createWorker } from "./worker";
import type { TestConfiguration, WorkerResult } from "../types";

export async function runTransactionTest(config: TestConfiguration): Promise<void> {
  const wallet = new ethers.Wallet(config.privateKey);

  console.info(`🚀 Starting EVM transaction test with configuration:
    Duration: ${config.duration} seconds
    Transaction Type: ${config.txType}
    RPC Endpoint: ${config.rpc}
    Concurrency: ${config.concurrency}
    From: ${wallet.address}
    To: ${config.recipient}
  `);

  // Validate transaction type support before starting workers
  try {
    const providerManager = new ProviderManager(config.rpc);
    const executor = new TransactionExecutor(config.privateKey, providerManager, config.recipient);
    await executor.initialize();
    await executor.validateTransactionType(config.txType);
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }

  const endTime = Date.now() + config.duration * 1000;

  // Create worker configurations
  const workerConfigs = Array.from({ length: config.concurrency }, (_, i) => ({
    id: i + 1,
    config,
    endTime
  }));

  // Run all workers in parallel
  const results: WorkerResult[] = await Promise.all(workerConfigs.map(createWorker));

  // Calculate and display results
  const totalTransactions = results.reduce((sum, result) => sum + result.transactionCount, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

  console.log(
    `\nDone! Sent ${totalTransactions} transactions across ${config.concurrency} workers.`
  );

  if (totalErrors > 0) {
    console.log(`Total errors: ${totalErrors}`);
  }
}
