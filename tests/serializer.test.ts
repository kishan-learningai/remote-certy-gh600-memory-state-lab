import test from 'node:test';
import assert from 'node:assert';

import { serialize, deserialize } from '../src/state/stateSerializer';
import { WorkflowState } from '../src/state/workflowState';
import { CheckpointStore } from '../src/state/checkpoints';

test('round-trip serialize then deserialize equals the original', () => {
  const original = {
    runId: 'run-bugfix-0001',
    issueNumber: 412,
    status: 'running',
    actions: ['reproduce', 'fix', 'verify'],
    nested: { attempts: 2, flags: { retry: true } },
  };

  const restored = deserialize<typeof original>(serialize(original));
  assert.deepStrictEqual(restored, original);
});

test('serialised output is stable regardless of key order', () => {
  const a = serialize({ b: 2, a: 1, c: { y: 2, x: 1 } });
  const b = serialize({ c: { x: 1, y: 2 }, a: 1, b: 2 });
  assert.strictEqual(a, b);
});

test('deserialize rejects invalid JSON', () => {
  assert.throws(() => deserialize('{ not json'), /not valid JSON/);
});

test('deserialize rejects a payload missing the envelope', () => {
  assert.throws(() => deserialize('{"foo":1}'), /missing the expected envelope/);
});

test('workflow state survives a serialise and restore cycle', () => {
  const state = new WorkflowState();
  state.transitionTo('planning');
  state.transitionTo('running');

  const restored = WorkflowState.fromSnapshot(
    deserialize<ReturnType<WorkflowState['snapshot']>>(serialize(state.snapshot())),
  );

  assert.strictEqual(restored.status, 'running');
  assert.deepStrictEqual(restored.snapshot().history, ['idle', 'planning', 'running']);
});

test('checkpoint restore returns an independent copy', () => {
  const store = new CheckpointStore<{ count: number }>();
  const live = { count: 1 };
  store.save('before-edit', live, '2026-06-01T00:00:00.000Z');

  // Mutating the live object must not affect the stored checkpoint.
  live.count = 99;
  const restored = store.restore('before-edit');
  assert.strictEqual(restored.count, 1);

  assert.throws(() => store.restore('missing'), /No checkpoint named/);
  assert.strictEqual(store.has('before-edit'), true);
});
