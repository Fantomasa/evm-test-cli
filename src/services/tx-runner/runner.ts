import { ethers } from "ethers";
import type { Options } from "./types";
import { buildTx } from "../tx-builder/tx-builder";

export async function runTxForSeconds(options: Options) {
  const provider = new ethers.JsonRpcProvider(options.rpc);
  const wallet = new ethers.Wallet(options.key, provider);

  console.log(
    `Running ${options.txType} txs for ${options.duration} seconds... Sending from ${wallet.address} to ${options.to}`
  );
  const endTime = Date.now() + options.duration * 1000;

  let count = 0;

  while (Date.now() < endTime) {
    try {
      const txRequest = await buildTx(wallet, options.to, options.txType);
      const tx = await wallet.sendTransaction(txRequest);
      await tx.wait();
      count++;
      console.log(`Tx ${count} sent: ${tx.hash}`);
    } catch (error) {
      console.error(`Tx failed: ${error}`);
    }
  }

  console.log(`\nDone! Sent ${count} transactions.`);
}
