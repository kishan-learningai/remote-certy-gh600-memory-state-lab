# Memory architecture

GH-600 module 3.0 - Memory, State and GitHub Context.

An agent that forgets everything between turns is barely an agent. An agent
that remembers everything is a liability. The job is to remember the right
things, in the right place, for the right length of time.

This lab models three complementary kinds of memory plus a policy gate.

## Short-term (working) memory

`src/memory/shortTermMemory.ts`

A small, bounded buffer of the most recent items. When it is full the oldest
item is dropped. This mirrors the agent's working context: it is deliberately
small so the context window stays focused on what matters now.

- Use it for: the last few tool results, the current train of thought.
- Do not use it for: anything that must outlive the current task.

## Episodic memory

`src/memory/episodicMemory.ts`

A timeline of past runs ("episodes"). Each record captures which issue was
worked on, what actions were taken, and the outcome. This is how an agent
recalls what it already tried and how a run can be replayed.

- `record(...)` appends a run.
- `all()` returns the full history.
- `lastForIssue(n)` finds the most recent run for an issue.

## Semantic memory

`src/memory/semanticMemory.ts`

Durable facts recalled by keyword: conventions, decisions, learned facts.
Recall is deterministic keyword matching - no embeddings, no network, no model
calls - so the lab is fully reproducible. In production you might swap this for
a vector store, but the contract (store a fact, recall by query) is the same.

## The policy gate

`src/memory/memoryPolicy.ts`

Nothing reaches episodic or semantic memory without passing the policy gate.
It blocks secrets and PII using deterministic regular expressions. See
`retention-policy.md` and `privacy-considerations.md`.

## The core teaching point

Memory is not "store everything". Decide what to remember, never store
secrets, survive across tasks, and resume from checkpoints. In multi-agent
workflows, lock shared state so two agents never write it at once.
