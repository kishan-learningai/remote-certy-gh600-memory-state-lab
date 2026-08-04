/**
 * State lock: a simple in-memory mutex.
 *
 * GH-600 teaching point: in multi-agent workflows two agents must never
 * write the same state at once. A lock makes ownership explicit: one holder
 * at a time, and the second acquire fails (or waits) until release. This is
 * an in-process teaching model, not a distributed lock.
 */

export class StateLock {
  private heldBy: string | undefined;
  private readonly waiters: Array<{
    owner: string;
    resolve: () => void;
  }> = [];

  /** True when the lock is currently held. */
  get isLocked(): boolean {
    return this.heldBy !== undefined;
  }

  /** The current owner, or undefined when free. */
  get owner(): string | undefined {
    return this.heldBy;
  }

  /**
   * Try to take the lock immediately.
   * Returns true on success, false if it is already held.
   */
  tryAcquire(owner: string): boolean {
    if (this.heldBy !== undefined) {
      return false;
    }
    this.heldBy = owner;
    return true;
  }

  /**
   * Take the lock, waiting in a fair queue if it is busy.
   * Resolves once the caller owns the lock.
   */
  acquire(owner: string): Promise<void> {
    if (this.heldBy === undefined) {
      this.heldBy = owner;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiters.push({ owner, resolve });
    });
  }

  /**
   * Release the lock. The owner must match the current holder.
   * Hands the lock to the next waiter, if any.
   */
  release(owner: string): void {
    if (this.heldBy === undefined) {
      throw new Error('Cannot release a lock that is not held.');
    }
    if (this.heldBy !== owner) {
      throw new Error(
        `Lock is held by "${this.heldBy}", not "${owner}"; refusing to release.`,
      );
    }
    const next = this.waiters.shift();
    if (next) {
      this.heldBy = next.owner;
      next.resolve();
    } else {
      this.heldBy = undefined;
    }
  }
}
