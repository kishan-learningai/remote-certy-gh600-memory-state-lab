/**
 * Checkpoints: save and restore named snapshots of state.
 *
 * GH-600 teaching point: a long task should be resumable. If an agent is
 * interrupted, it should resume from the last good checkpoint instead of
 * starting over. Snapshots are stored as serialised strings so they are
 * immutable copies, not live references.
 */

import { serialize, deserialize } from './stateSerializer';

export interface CheckpointMeta {
  readonly name: string;
  /** ISO 8601 timestamp the checkpoint was taken. */
  readonly savedAt: string;
}

export class CheckpointStore<T> {
  private readonly checkpoints = new Map<string, { savedAt: string; payload: string }>();

  /**
   * Save the current state under a name, overwriting any earlier checkpoint
   * with the same name. The savedAt timestamp may be supplied for
   * deterministic tests.
   */
  save(name: string, state: T, savedAt?: string): CheckpointMeta {
    if (name.trim().length === 0) {
      throw new Error('Checkpoint name must not be empty.');
    }
    const stamp = savedAt ?? new Date().toISOString();
    this.checkpoints.set(name, { savedAt: stamp, payload: serialize(state) });
    return { name, savedAt: stamp };
  }

  /**
   * Restore state from a named checkpoint.
   * Throws if the checkpoint does not exist.
   */
  restore(name: string): T {
    const entry = this.checkpoints.get(name);
    if (!entry) {
      throw new Error(`No checkpoint named "${name}".`);
    }
    return deserialize<T>(entry.payload);
  }

  /** True when a checkpoint with the given name exists. */
  has(name: string): boolean {
    return this.checkpoints.has(name);
  }

  /** List checkpoint metadata, in insertion order. */
  list(): ReadonlyArray<CheckpointMeta> {
    return [...this.checkpoints.entries()].map(([name, { savedAt }]) => ({
      name,
      savedAt,
    }));
  }

  /** Remove a checkpoint; returns true if one was removed. */
  delete(name: string): boolean {
    return this.checkpoints.delete(name);
  }
}
