import type { Options } from "./types";
import { worker } from "./helpers";
import { WalletTxExecutor } from "../../lib/WalletTxExexutor";
import { ethers } from "ethers";

export async function runTxForSeconds(options: Options) {
  // Reset singleton to ensure fresh state for each test run
  WalletTxExecutor.reset();

  const wallet = new ethers.Wallet(options.key);

  console.info(`🚀 Starting EVM transaction test with configuration:
    Duration: ${options.duration} seconds
    Transaction Type: ${options.txType}
    RPC Endpoint: ${options.rpc}
    Concurrency: ${options.concurrency}
    From: ${wallet.address},
    To: ${options.to}
  `);

  // Validate transaction type support before starting workers
  try {
    const walletTxExecutor = WalletTxExecutor.getInstance(options.key, options.rpc, options.to);
    await walletTxExecutor.initialize();
    await walletTxExecutor.validateTransactionType(options.txType);
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }

  const endTime = Date.now() + options.duration * 1000;
  const workers = Array.from({ length: options.concurrency }, (_, i) =>
    worker(i + 1, options, endTime)
  );

  const results = await Promise.all(workers);
  const total = results.reduce((a, b) => a + b, 0);

  console.log(`\nDone! Sent ${total} transactions across ${options.concurrency} workers.`);
}
