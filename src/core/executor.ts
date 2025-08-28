import { ethers } from "ethers";
import type { TransactionResponse } from "ethers";
import { TransactionBuilder } from "../transaction/builder";
import { TransactionValidator } from "../transaction/validator";
import { ProviderManager } from "./provider";
import type { TransactionType, NonceInfo } from "../types";

export class TransactionExecutor {
  private wallet: ethers.Wallet;
  private builder: TransactionBuilder;
  private validator: TransactionValidator;
  private baseNonce: number | null = null;
  private nonceCounter = 0;

  constructor(privateKey: string, providerManager: ProviderManager, recipientAddress: string) {
    const provider = providerManager.getProvider();
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.builder = new TransactionBuilder(provider, recipientAddress);
    this.validator = new TransactionValidator(provider);
  }

  async initialize(): Promise<void> {
    if (this.baseNonce === null) {
      this.baseNonce = await this.wallet.getNonce();
    }
  }

  async validateTransactionType(type: TransactionType): Promise<void> {
    await this.validator.validateTransactionType(type);
  }

  async sendTransaction(type: TransactionType): Promise<TransactionResponse> {
    await this.ensureInitialized();

    const nonce = this.getNextNonce();
    const txRequest = await this.builder.buildTransaction(type, nonce);

    return this.wallet.sendTransaction(txRequest);
  }

  getNonceInfo(): NonceInfo {
    return {
      baseNonce: this.baseNonce,
      currentCounter: this.nonceCounter
    };
  }

  getWalletAddress(): string {
    return this.wallet.address;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.baseNonce === null) {
      await this.initialize();
    }
  }

  private getNextNonce(): number {
    if (this.baseNonce === null) {
      throw new Error("TransactionExecutor is not initialized");
    }

    const currentNonce = this.baseNonce + this.nonceCounter;
    this.nonceCounter++;
    return currentNonce;
  }
}
