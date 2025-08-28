import { ethers } from "ethers";

export class ProviderManager {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getNetwork() {
    return this.provider.getNetwork();
  }

  async getChainId(): Promise<bigint> {
    const network = await this.getNetwork();
    return network.chainId;
  }
}
