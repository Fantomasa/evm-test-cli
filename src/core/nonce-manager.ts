export class NonceManager {
  private currentNonce: number;
  private totalAllocated: number = 0;

  constructor(baseNonce: number) {
    this.currentNonce = baseNonce;
    // Nonce manager initialized
  }

  getNextNonce(): number {
    // JavaScript's single-threaded nature makes this atomic
    const nonce = this.currentNonce;
    this.currentNonce++;
    this.totalAllocated++;

    // Track nonce allocations silently

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
    // Nonce manager reset completed
  }

  getStats() {
    return {
      currentNonce: this.currentNonce,
      totalAllocated: this.totalAllocated,
      nextNonce: this.currentNonce
    };
  }
}
