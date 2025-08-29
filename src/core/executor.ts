import { ethers } from "ethers";
import type { TransactionResponse } from "ethers";
import { TransactionBuilder } from "../transaction/builder";
import { TransactionValidator } from "../transaction/validator";
import { ProviderManager } from "./provider";
import { NonceManager } from "./nonce-manager";
import type { TransactionType, NonceInfo } from "../types";

export class TransactionExecutor {
  private wallet: ethers.Wallet;
  private builder: TransactionBuilder;
  private validator: TransactionValidator;
  private nonceManager: NonceManager;

  constructor(
    privateKey: string,
    providerManager: ProviderManager,
    recipientAddress: string,
    nonceManager: NonceManager
  ) {
    const provider = providerManager.getProvider();
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.builder = new TransactionBuilder(provider, recipientAddress);
    this.validator = new TransactionValidator(provider);
    this.nonceManager = nonceManager;
  }

  async initialize(): Promise<void> {
    // No longer need to manage nonce locally - handled by NonceManager
  }

  async validateTransactionType(type: TransactionType): Promise<void> {
    await this.validator.validateTransactionType(type);
  }

  async sendTransaction(type: TransactionType): Promise<TransactionResponse> {
    const nonce = this.nonceManager.getNextNonce();
    const txRequest = await this.builder.buildTransaction(type, nonce);

    return this.wallet.sendTransaction(txRequest);
  }

  getNonceInfo(): NonceInfo {
    return {
      baseNonce: this.nonceManager.getCurrentNonce(),
      currentCounter: this.nonceManager.getUsedCount()
    };
  }

  getWalletAddress(): string {
    return this.wallet.address;
  }

  getProvider() {
    return this.wallet.provider!;
  }

  async getCurrentNetworkNonce(): Promise<number> {
    return await this.wallet.getNonce();
  }

  async getRealTimeNonce(): Promise<number> {
    // Use getTransactionCount with 'pending' to bypass caching
    const provider = this.wallet.provider!;
    const nonce = await provider.getTransactionCount(this.wallet.address, "pending");
    return nonce;
  }

  async debugNonceStatus(): Promise<void> {
    // Debug functionality removed for cleaner output
  }

  async recoverFromNonceError(): Promise<void> {
    const realTimeNonce = await this.getRealTimeNonce();
    this.nonceManager.reset(realTimeNonce);
  }
}
