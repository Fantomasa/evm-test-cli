import { WalletTxExecutor } from "./WalletTxExexutor";
import type { Options } from "./types";

export async function worker(id: number, opts: Options, endTime: number) {
  const walletTxExecutor = WalletTxExecutor.getInstance(opts.key, opts.rpc, opts.to);

  await walletTxExecutor.initialize();

  let count = 0;
  while (Date.now() < endTime) {
    try {
      const txStartTime = Date.now();

      const tx = await walletTxExecutor.sendTransaction(opts.txType);
      // await tx.wait();

      const txEndTime = Date.now();
      const duration = txEndTime - txStartTime;

      count++;
      console.log(`Worker (${id}): ${tx.hash} finished in ${Math.round(duration / 1000)}s`);
    } catch (e: any) {
      console.error(`Worker (${id}): tx failed - ${e.message}`);
      // Add small delay to avoid rapid retries
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return count;
}
