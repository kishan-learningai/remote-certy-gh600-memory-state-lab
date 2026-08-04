import test from 'node:test';
import assert from 'node:assert';

import { StateLock } from '../src/state/stateLock';

test('lock prevents a second acquire until release', () => {
  const lock = new StateLock();

  assert.strictEqual(lock.tryAcquire('agent-a'), true);
  assert.strictEqual(lock.isLocked, true);
  assert.strictEqual(lock.owner, 'agent-a');

  // A second agent cannot take the lock while it is held.
  assert.strictEqual(lock.tryAcquire('agent-b'), false);

  lock.release('agent-a');
  assert.strictEqual(lock.isLocked, false);

  // Now the second agent can take it.
  assert.strictEqual(lock.tryAcquire('agent-b'), true);
  assert.strictEqual(lock.owner, 'agent-b');
});

test('release by the wrong owner is rejected', () => {
  const lock = new StateLock();
  lock.tryAcquire('agent-a');
  assert.throws(() => lock.release('agent-b'), /held by "agent-a"/);
});

test('releasing a free lock throws', () => {
  const lock = new StateLock();
  assert.throws(() => lock.release('agent-a'), /not held/);
});

test('a queued acquire resolves only after release', async () => {
  const lock = new StateLock();
  await lock.acquire('agent-a');

  let secondGranted = false;
  const second = lock.acquire('agent-b').then(() => {
    secondGranted = true;
  });

  // The queued acquire must not have resolved yet.
  await Promise.resolve();
  assert.strictEqual(secondGranted, false);
  assert.strictEqual(lock.owner, 'agent-a');

  lock.release('agent-a');
  await second;
  assert.strictEqual(secondGranted, true);
  assert.strictEqual(lock.owner, 'agent-b');
});
