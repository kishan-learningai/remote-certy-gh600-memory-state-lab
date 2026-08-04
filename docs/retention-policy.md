# Retention policy

What an agent keeps, and for how long, is a deliberate decision - not an
accident of whatever happened to pass through the context window.

## Tiers and lifetimes

| Tier            | Holds                          | Lifetime                         |
| --------------- | ------------------------------ | -------------------------------- |
| Short-term      | Recent tool results, scratch   | This task only; bounded buffer   |
| Episodic        | Run records (issue, actions)   | Across tasks; prune by age/count |
| Semantic        | Conventions, learned facts     | Long-lived; review periodically  |
| Checkpoints     | Snapshots for resume           | Until the task finishes          |

## Rules

1. **Gate before you store.** Run every candidate value through
   `evaluateForStorage` (`src/memory/memoryPolicy.ts`). Secrets and PII are
   rejected outright.
2. **Bound the short-term buffer.** `ShortTermMemory` has a fixed capacity;
   the oldest item is dropped when it overflows.
3. **Prune episodic memory.** Keep enough history to replay and learn from,
   but cap it by count or age so it does not grow without limit.
4. **Review semantic facts.** Long-lived facts can go stale. Re-validate
   conventions when the codebase changes.
5. **Delete checkpoints when done.** A checkpoint is for resuming an
   in-flight task, not a permanent archive.

## Locking shared state

In a multi-agent workflow several agents may target the same state. Without a
lock, two agents can read, edit and write concurrently and silently clobber
each other (a lost-update race). `StateLock` enforces single ownership:

- `tryAcquire(owner)` succeeds only if the lock is free.
- `acquire(owner)` waits in a fair queue if the lock is busy.
- `release(owner)` must be called by the holder and hands off to the next
  waiter.

Always release in a `finally` block so a failing agent does not deadlock the
others.
