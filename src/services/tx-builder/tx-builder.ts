import type { Wallet, TransactionRequest } from "ethers";
import { TxType } from "../../common/types";
import { chainSupportsBlobTx } from "./helpers";
import type { JsonRpcProvider } from "ethers";

export async function buildTx(
  wallet: Wallet,
  to: string,
  type: TxType
): Promise<TransactionRequest> {
  const nonce = await wallet.getNonce();
  const chainId = await wallet.provider?.getNetwork().then((n) => n.chainId);

  if (type === TxType.LEGACY) {
    return {
      to,
      value: 1n,
      nonce,
      gasLimit: 21_000n
    };
  }

  if (type === TxType.EIP1559) {
    const fee = await wallet.provider?.getFeeData();

    return {
      to,
      value: 1n,
      nonce,
      gasLimit: 21_000n,
      type: 2,
      maxFeePerGas: fee?.maxFeePerGas,
      maxPriorityFeePerGas: fee?.maxPriorityFeePerGas
    };
  }

  if (type === TxType.BLOB) {
    const blobIsSupported = await chainSupportsBlobTx(wallet.provider as JsonRpcProvider);
    if (!blobIsSupported) throw new Error("The chain doesn't support blob tx");

    const fee = await wallet.provider?.getFeeData();

    return {
      to,
      value: 1n,
      nonce,
      gasLimit: 50000n,
      type: 3,
      blobs: [new Uint8Array([1, 2, 3])],
      maxFeePerBlobGas: fee?.maxFeePerGas
    };
  }

  throw new Error("Unknown tx type");
}
