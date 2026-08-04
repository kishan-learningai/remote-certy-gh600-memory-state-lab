/**
 * State serialiser: turn agent state into a JSON string and back.
 *
 * GH-600 teaching point: to survive across tasks, state must be written
 * somewhere durable. Serialisation is the bridge. A correct serialiser
 * round-trips: deserialize(serialize(x)) deeply equals x. Keys are sorted
 * so the output is stable and diff-friendly.
 */

export interface SerializedEnvelope<T> {
  /** Schema version, so old payloads can be migrated later. */
  readonly version: number;
  /** The serialised payload. */
  readonly state: T;
}

const ENVELOPE_VERSION = 1;

/** Recursively sort object keys for deterministic output. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, sortKeys(v)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

/** Serialise state to a stable JSON string wrapped in a versioned envelope. */
export function serialize<T>(state: T): string {
  const envelope: SerializedEnvelope<T> = { version: ENVELOPE_VERSION, state };
  return JSON.stringify(sortKeys(envelope));
}

/** Parse a serialised string back into state, validating the envelope. */
export function deserialize<T>(json: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('State payload is not valid JSON.');
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    !('state' in parsed)
  ) {
    throw new Error('State payload is missing the expected envelope.');
  }
  const envelope = parsed as SerializedEnvelope<T>;
  if (envelope.version !== ENVELOPE_VERSION) {
    throw new Error(
      `Unsupported state version ${envelope.version}; expected ${ENVELOPE_VERSION}.`,
    );
  }
  return envelope.state;
}
