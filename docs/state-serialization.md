# State serialisation

`src/state/stateSerializer.ts`, `src/state/workflowState.ts`,
`src/state/checkpoints.ts`, `src/state/stateLock.ts`

To survive across tasks, agent state must be written somewhere durable.
Serialisation is the bridge between the live objects in memory and a string
you can store on disk, in a database, or in a workflow artefact.

## The round-trip contract

A correct serialiser round-trips:

```
deserialize(serialize(x))  deeply equals  x
```

`serializer.test.ts` enforces this. The serialiser also sorts object keys
recursively, so the same state always produces the same string. Stable output
means clean diffs and reliable equality checks.

## Versioned envelopes

Every payload is wrapped in a small envelope:

```json
{ "version": 1, "state": { ... } }
```

The version lets you migrate old payloads when the shape changes. Deserialise
rejects payloads that are not valid JSON, that lack the envelope, or that carry
an unsupported version - fail loud, not silently.

## Workflow state

`WorkflowState` is a small status machine: `idle -> planning -> running ->
completed` (with `blocked` and `failed` branches). Illegal transitions throw.
`snapshot()` produces a plain object you can serialise; `fromSnapshot()`
rebuilds it. This gives you a single value to checkpoint and resume.

## Checkpoints

`CheckpointStore` saves named snapshots as serialised strings. Because each
snapshot is an immutable string copy, mutating the live state after a save
never corrupts the checkpoint. Restore from the last good checkpoint instead
of starting a long task over.

## State locks

`StateLock` is an in-process mutex. One owner at a time; a second `tryAcquire`
returns false, and a queued `acquire` waits until release. See
`retention-policy.md` for why this matters in multi-agent workflows.
