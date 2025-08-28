import { TransactionExecutor } from "../core/executor";
import { ProviderManager } from "../core/provider";
import type { WorkerConfig, WorkerResult } from "../types";
import { DEFAULT_VALUES } from "../utils/constants";

export async function createWorker(config: WorkerConfig): Promise<WorkerResult> {
  const { id, config: testConfig, endTime } = config;

  // Create fresh instances for each worker to avoid shared state issues
  const providerManager = new ProviderManager(testConfig.rpc);
  const executor = new TransactionExecutor(
    testConfig.privateKey,
    providerManager,
    testConfig.recipient
  );

  await executor.initialize();

  let transactionCount = 0;
  const errors: string[] = [];

  while (Date.now() < endTime) {
    try {
      const txStartTime = Date.now();

      const tx = await executor.sendTransaction(testConfig.txType);

      const txEndTime = Date.now();
      const duration = txEndTime - txStartTime;

      transactionCount++;
      console.log(`Worker (${id}): ${tx.hash} finished in ${(duration / 1000).toFixed(2)}s`);

      await new Promise((resolve) => setTimeout(resolve, DEFAULT_VALUES.WORKER_DELAY));
    } catch (error: any) {
      const errorMessage = `tx failed - ${error.message}`;
      console.error(`Worker (${id}): ${errorMessage}`);
      errors.push(errorMessage);

      // Add small delay to avoid rapid retries
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_VALUES.RETRY_DELAY));
    }
  }

  return {
    workerId: id,
    transactionCount,
    errors
  };
}
