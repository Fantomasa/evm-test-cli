import type { TransactionRequest, JsonRpcProvider } from "ethers";
import { TransactionType } from "../types";
import {
  DEFAULT_GAS_LIMITS,
  DEFAULT_VALUES,
  TRANSACTION_TYPES,
  BLOB_CONFIG
} from "../utils/constants";

export class TransactionBuilder {
  constructor(private provider: JsonRpcProvider, private recipientAddress: string) {}

  async buildTransaction(type: TransactionType, nonce: number): Promise<TransactionRequest> {
    switch (type) {
      case TransactionType.LEGACY:
        return this.buildLegacyTransaction(nonce);

      case TransactionType.EIP1559:
        return this.buildEIP1559Transaction(nonce);

      case TransactionType.BLOB:
        return this.buildBlobTransaction(nonce);

      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  private async buildLegacyTransaction(nonce: number): Promise<TransactionRequest> {
    const feeData = await this.provider.getFeeData();

    return {
      to: this.recipientAddress,
      value: DEFAULT_VALUES.TRANSFER_AMOUNT,
      nonce,
      gasLimit: DEFAULT_GAS_LIMITS[TransactionType.LEGACY],
      type: TRANSACTION_TYPES.LEGACY,
      gasPrice: feeData.gasPrice
    };
  }

  private async buildEIP1559Transaction(nonce: number): Promise<TransactionRequest> {
    const feeData = await this.provider.getFeeData();

    return {
      to: this.recipientAddress,
      value: DEFAULT_VALUES.TRANSFER_AMOUNT,
      nonce,
      gasLimit: DEFAULT_GAS_LIMITS[TransactionType.EIP1559],
      type: TRANSACTION_TYPES.EIP1559,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
  }

  private async buildBlobTransaction(nonce: number): Promise<TransactionRequest> {
    const feeData = await this.provider.getFeeData();

    return {
      to: this.recipientAddress,
      value: DEFAULT_VALUES.TRANSFER_AMOUNT,
      nonce,
      gasLimit: DEFAULT_GAS_LIMITS[TransactionType.BLOB],
      type: TRANSACTION_TYPES.BLOB,
      blobs: [BLOB_CONFIG.DUMMY_BLOB_DATA],
      maxFeePerBlobGas: feeData.maxFeePerGas
    };
  }
}
