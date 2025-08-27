import type { Options } from "./types";
import { worker } from "./helpers";
import { ethers } from "ethers";

export async function runTxForSeconds(options: Options) {
  const wallet = new ethers.Wallet(options.key);

  console.info(`🚀 Starting EVM transaction test with configuration:
    Duration: ${options.duration} seconds
    Transaction Type: ${options.txType}
    RPC Endpoint: ${options.rpc}
    Concurrency: ${options.concurrency}
    From: ${wallet.address},
    To: ${options.to}
  `);

  const endTime = Date.now() + options.duration * 1000;
  const workers = Array.from({ length: options.concurrency }, (_, i) =>
    worker(i + 1, options, endTime)
  );

  const results = await Promise.all(workers);
  const total = results.reduce((a, b) => a + b, 0);

  console.log(`\nDone! Sent ${total} transactions across ${options.concurrency} workers.`);
}
