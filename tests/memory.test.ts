import test from 'node:test';
import assert from 'node:assert';

import { evaluateForStorage, mayStore } from '../src/memory/memoryPolicy';
import { SemanticMemory } from '../src/memory/semanticMemory';
import { EpisodicMemory } from '../src/memory/episodicMemory';
import { ShortTermMemory } from '../src/memory/shortTermMemory';

test('memory policy blocks a fake secret token', () => {
  const decision = evaluateForStorage(
    'here is the value GHAS_TRAINING_FAKE_TOKEN_DO_NOT_USE_123 to keep',
  );
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason, 'secret');
  assert.strictEqual(mayStore('GHAS_TRAINING_FAKE_TOKEN_DO_NOT_USE_123'), false);
});

test('memory policy blocks an email address as PII', () => {
  const decision = evaluateForStorage('contact the reporter at user@example.com please');
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason, 'pii');
});

test('memory policy allows safe technical notes', () => {
  const decision = evaluateForStorage('The pagination helper was off by one.');
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason, undefined);
});

test('memory policy rejects empty content', () => {
  assert.strictEqual(evaluateForStorage('   ').allowed, false);
  assert.strictEqual(evaluateForStorage('   ').reason, 'empty');
});

test('semantic recall finds facts by keyword, case-insensitively', () => {
  const memory = new SemanticMemory();
  memory.remember(
    'pagination-convention',
    'Pages are one-indexed across the API.',
    ['pagination', 'API', 'pages'],
  );
  memory.remember(
    'commit-style',
    'Commit messages use British English.',
    ['commit', 'style', 'english'],
  );

  const hits = memory.recall('PAGINATION');
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].key, 'pagination-convention');

  assert.strictEqual(memory.recall('missing').length, 0);
  assert.strictEqual(memory.size, 2);
});

test('episodic memory records runs and recalls the last for an issue', () => {
  const memory = new EpisodicMemory();
  memory.record({
    runId: 'r1',
    issueNumber: 412,
    agent: 'bugfix-agent',
    actions: ['reproduce', 'fix'],
    outcome: 'failure',
    recordedAt: '2026-06-01T09:00:00.000Z',
  });
  memory.record({
    runId: 'r2',
    issueNumber: 412,
    agent: 'bugfix-agent',
    actions: ['reproduce', 'fix', 'verify'],
    outcome: 'success',
    recordedAt: '2026-06-01T10:00:00.000Z',
  });

  assert.strictEqual(memory.size, 2);
  const last = memory.lastForIssue(412);
  assert.strictEqual(last?.runId, 'r2');
  assert.strictEqual(last?.outcome, 'success');
  assert.strictEqual(memory.lastForIssue(999), undefined);
});

test('short-term memory keeps only the most recent items', () => {
  const buffer = new ShortTermMemory<string>(2);
  buffer.add('a');
  buffer.add('b');
  buffer.add('c');

  assert.strictEqual(buffer.size, 2);
  assert.deepStrictEqual(
    buffer.recent().map((item) => item.value),
    ['b', 'c'],
  );
  assert.strictEqual(buffer.latest()?.value, 'c');
});
