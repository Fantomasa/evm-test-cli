import { ethers } from "ethers";
import { buildTx } from "../tx-builder/tx-builder";

import type { Options } from "./types";

export async function worker(id: number, opts: Options, endTime: number) {
  const provider = new ethers.JsonRpcProvider(opts.rpc);
  const wallet = new ethers.Wallet(opts.key, provider);

  let count = 0;
  while (Date.now() < endTime) {
    try {
      const txRequest = await buildTx(wallet, opts.to, opts.txType);
      const tx = await wallet.sendTransaction(txRequest);
      await tx.wait();
      count++;
      console.log(`Worker (${id}): ${tx.hash} finished`);
    } catch (e: any) {
      console.error(`Worker (${id}): tx failed - ${e.message}`);
      // Add small delay to avoid rapid retries
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return count;
}
