export class NonceManager {
  private currentNonce: number;
  private totalAllocated: number = 0;

  constructor(baseNonce: number) {
    this.currentNonce = baseNonce;
    console.log(`📊 NonceManager initialized with base nonce: ${baseNonce}`);
  }

  getNextNonce(): number {
    // JavaScript's single-threaded nature makes this atomic
    const nonce = this.currentNonce;
    this.currentNonce++;
    this.totalAllocated++;

    // Log every 50 nonce allocations to track progress
    if (this.totalAllocated % 50 === 0) {
      console.log(`📈 NonceManager: allocated ${this.totalAllocated} nonces, current: ${nonce}`);
    }

    return nonce;
  }

  getCurrentNonce(): number {
    return this.currentNonce;
  }

  getUsedCount(): number {
    return this.currentNonce;
  }

  reset(newBaseNonce: number): void {
    const oldNonce = this.currentNonce;
    this.currentNonce = newBaseNonce;
    this.totalAllocated = 0;
    console.log(`🔄 NonceManager reset from ${oldNonce} to ${newBaseNonce}`);
  }

  getStats() {
    return {
      currentNonce: this.currentNonce,
      totalAllocated: this.totalAllocated,
      nextNonce: this.currentNonce
    };
  }
}
