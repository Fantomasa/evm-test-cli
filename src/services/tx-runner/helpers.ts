import { WalletTxExecutor } from "../../lib/WalletTxExexutor";
import type { Options } from "./types";

export async function worker(id: number, opts: Options, endTime: number) {
  const walletTxExecutor = WalletTxExecutor.getInstance(opts.key, opts.rpc, opts.to);

  await walletTxExecutor.initialize();

  let count = 0;
  while (Date.now() < endTime) {
    try {
      const txStartTime = Date.now();

      const tx = await walletTxExecutor.sendTransaction(opts.txType);

      const txEndTime = Date.now();
      const duration = txEndTime - txStartTime;

      count++;
      console.log(`Worker (${id}): ${tx.hash} finished in ${(duration / 1000).toFixed(2)}s`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e: any) {
      console.error(`Worker (${id}): tx failed - ${e.message}`);
      // Add small delay to avoid rapid retries
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return count;
}
