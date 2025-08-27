import { ethers } from "ethers";
import type { Options } from "./types";
import { buildTx } from "../tx-builder/tx-builder";

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
      process.stdout.write(`w${id}.`);
    } catch (e) {
      process.stdout.write(`w${id}x`);
    }
  }
  return count;
}
