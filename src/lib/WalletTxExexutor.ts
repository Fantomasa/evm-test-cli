import { ethers } from "ethers";
import type { TransactionRequest } from "ethers";

import { chainSupportsBlobTx } from "../services/tx-builder/helpers";
import { TxType } from "../common/types";

export class WalletTxExecutor {
  private static instance: WalletTxExecutor | null = null;

  private wallet: ethers.Wallet;
  private to: string;
  private baseNonce: number | null = null;
  private nonceCounter = 0;

  private constructor(privateKey: string, rpcUrl: string, to?: string) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.to = to ?? this.wallet.address;
  }

  static getInstance(privateKey?: string, rpcUrl?: string, to?: string): WalletTxExecutor {
    if (!WalletTxExecutor.instance) {
      if (!privateKey || !rpcUrl) {
        throw new Error("First call to getInstance must provide privateKey and rpcUrl");
      }
      WalletTxExecutor.instance = new WalletTxExecutor(privateKey, rpcUrl, to);
    }
    return WalletTxExecutor.instance;
  }

  static reset(): void {
    WalletTxExecutor.instance = null;
  }

  async initialize(): Promise<void> {
    if (this.baseNonce === null) {
      this.baseNonce = await this.wallet.getNonce();
    }
  }

  async validateTransactionType(type: TxType): Promise<void> {
    if (type === TxType.BLOB) {
      const blobIsSupported = await chainSupportsBlobTx(
        this.wallet.provider as ethers.JsonRpcProvider
      );

      if (!blobIsSupported) {
        throw new Error("❌ The chain doesn't support blob transactions. Process stopped.");
      }

      console.log("✅ Blob transactions are supported on this chain.");
    }
  }

  async sendTransaction(type: TxType): Promise<ethers.TransactionResponse> {
    const txRequest = await this.buildTx(type);
    return this.wallet.sendTransaction(txRequest);
  }

  private async buildTx(type: TxType): Promise<TransactionRequest> {
    await this.initialize();

    const nonce = this.getNextNonce();
    const chainId = await this.wallet.provider?.getNetwork().then((n) => n.chainId);

    switch (type) {
      case TxType.LEGACY:
        return this.buildLegacyTx(nonce);

      case TxType.EIP1559:
        return this.buildEIP1559Tx(nonce);

      case TxType.BLOB:
        return this.buildBlobTx(nonce);

      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  getNonceInfo(): { baseNonce: number | null; currentCounter: number } {
    return {
      baseNonce: this.baseNonce,
      currentCounter: this.nonceCounter
    };
  }

  private getNextNonce(): number {
    if (this.baseNonce === null) {
      throw new Error("WalletTxExecutor is not initialized");
    }

    const currentNonce = this.baseNonce + this.nonceCounter;
    this.nonceCounter++;
    return currentNonce;
  }

  private async buildEIP1559Tx(nonce: number): Promise<TransactionRequest> {
    const fee = await this.wallet.provider?.getFeeData();

    return {
      to: this.to,
      value: 1n,
      nonce,
      gasLimit: 21_000n,
      type: 2,
      maxFeePerGas: fee?.maxFeePerGas,
      maxPriorityFeePerGas: fee?.maxPriorityFeePerGas
    };
  }

  private async buildBlobTx(nonce: number): Promise<TransactionRequest> {
    const fee = await this.wallet.provider?.getFeeData();

    return {
      to: this.to,
      value: 1n,
      nonce,
      gasLimit: 50_000n,
      type: 3,
      blobs: [new Uint8Array([1, 2, 3])],
      maxFeePerBlobGas: fee?.maxFeePerGas
    };
  }

  private buildLegacyTx(nonce: number): TransactionRequest {
    return {
      to: this.to,
      value: 1n,
      nonce,
      gasLimit: 21_000n
    };
  }
}
