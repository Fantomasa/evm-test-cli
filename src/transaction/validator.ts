import type { JsonRpcProvider } from "ethers";
import { TransactionType } from "../types";
import { validateChainSupport } from "../utils/chain-utils";

export class TransactionValidator {
  constructor(private provider: JsonRpcProvider) {}

  async validateTransactionType(type: TransactionType): Promise<void> {
    await validateChainSupport(this.provider, type);
  }
}
