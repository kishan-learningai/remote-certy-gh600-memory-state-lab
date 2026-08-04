/**
 * Short-term memory: a bounded recent-items buffer.
 *
 * GH-600 teaching point: an agent's working memory is small and recent.
 * It holds only the last few items so the context window stays focused.
 * When the buffer is full, the oldest item is dropped (first in, first out).
 */

export interface ShortTermMemoryItem<T> {
  /** Order in which the item was added, starting at 1. */
  readonly sequence: number;
  /** The remembered value. */
  readonly value: T;
}

export class ShortTermMemory<T> {
  private readonly buffer: ShortTermMemoryItem<T>[] = [];
  private nextSequence = 1;

  /**
   * @param capacity the maximum number of items to retain (must be >= 1).
   */
  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('ShortTermMemory capacity must be an integer >= 1.');
    }
  }

  /** Add an item, dropping the oldest if the buffer is full. */
  add(value: T): void {
    this.buffer.push({ sequence: this.nextSequence, value });
    this.nextSequence += 1;
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }
  }

  /** Return the retained items, oldest first. */
  recent(): ReadonlyArray<ShortTermMemoryItem<T>> {
    return [...this.buffer];
  }

  /** Return the most recent item, or undefined if the buffer is empty. */
  latest(): ShortTermMemoryItem<T> | undefined {
    return this.buffer[this.buffer.length - 1];
  }

  /** Current number of retained items. */
  get size(): number {
    return this.buffer.length;
  }

  /** Forget everything. */
  clear(): void {
    this.buffer.length = 0;
  }
}
