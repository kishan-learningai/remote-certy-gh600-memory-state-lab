# Labs - Memory, State and GitHub Context (GH-600 module 3.0)

Eight short exercises. Each one points at code in `src/` and a test in
`tests/`. Run the suite at any time:

```bash
npm install --no-fund --no-audit
npm test
npm run typecheck
```

Everything is deterministic - no API keys, no network, no model calls.

## Lab 1 - Compare the memory types

Read `src/memory/shortTermMemory.ts`, `episodicMemory.ts` and
`semanticMemory.ts`. Write down, in one line each, what each is for and an
example of something it should hold. Confirm `ShortTermMemory` drops the
oldest item when it overflows (see `memory.test.ts`).

## Lab 2 - Save an episodic record

Load `examples/bugfix-agent-run.json` and `examples/docs-agent-run.json` and
feed them into `EpisodicMemory.record(...)`. Use `lastForIssue(412)` to recall
the bugfix run. Add a second run for issue 412 and confirm the latest wins.

## Lab 3 - Serialise and restore

Use `serialize` / `deserialize` from `src/state/stateSerializer.ts` to
round-trip a `WorkflowState` snapshot. Verify the restored state deeply equals
the original and that key order does not change the output string.

## Lab 4 - Retention rules

Read `docs/retention-policy.md`. For each memory tier, decide a sensible
lifetime and pruning rule. Cap an `EpisodicMemory` to its most recent N runs
and justify your N.

## Lab 5 - Prevent unsafe storage

Pass `GHAS_TRAINING_FAKE_TOKEN_DO_NOT_USE_123` and an email address through
`evaluateForStorage`. Confirm both are rejected with reasons `secret` and
`pii`. Then confirm a plain technical note is allowed. Add one more secret
pattern of your own and a test for it.

## Lab 6 - State locking

Using `StateLock`, have "agent-a" acquire the lock, then show that
"agent-b" cannot acquire it until "agent-a" releases. Then queue a second
`acquire` and prove it resolves only after release (see `state-lock.test.ts`).

## Lab 7 - Replay a run

Take a record from episodic memory and walk a fresh `WorkflowState` through
`planning -> running -> completed`, logging each action from the record. This
is the essence of replaying a previous agent run from memory.

## Lab 8 - Summarise GitHub issue context

Given an episodic record (issue number, actions, outcome), produce a short,
safe summary string suitable for an issue comment - for example: "Run
run-bugfix-0001 on issue 412: reproduced, fixed and verified (success)."
Make sure the summary contains no secrets or PII; run it through
`evaluateForStorage` as a final check.
