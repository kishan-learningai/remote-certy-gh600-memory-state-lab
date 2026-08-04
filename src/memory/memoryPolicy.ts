/**
 * Memory policy: decide what an agent is allowed to remember.
 *
 * GH-600 teaching point: memory is NOT "store everything". Before any value
 * reaches episodic or semantic memory it must pass a policy gate that blocks
 * secrets and personal data (PII). Storing a token or a customer's email in
 * agent memory is a security incident waiting to happen.
 *
 * All checks are deterministic regular expressions - no network, no model.
 */

export type MemoryRejectionReason = 'secret' | 'pii' | 'empty';

export interface MemoryDecision {
  /** True when the content may be stored. */
  readonly allowed: boolean;
  /** Why the content was rejected, when allowed is false. */
  readonly reason?: MemoryRejectionReason;
  /** A short, safe explanation suitable for logs (contains no secret). */
  readonly detail?: string;
}

/** Patterns that indicate a credential or other secret. */
const SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  // GitHub personal access / fine-grained / app tokens.
  /\bgh[pousr]_[A-Za-z0-9]{16,}\b/,
  // Generic long token assigned to a *_TOKEN / *_SECRET / *_KEY name.
  /\b[A-Z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD)[A-Z0-9_]*\s*[:=]\s*\S+/,
  // AWS access key id.
  /\bAKIA[0-9A-Z]{16}\b/,
  // Private key block.
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  // The deliberate training fixture token.
  /\bGHAS_TRAINING_FAKE_TOKEN_DO_NOT_USE_\d+\b/,
];

/** Patterns that indicate personally identifiable information. */
const PII_PATTERNS: ReadonlyArray<RegExp> = [
  // Email address.
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  // Plausible international phone number.
  /\b\+?\d[\d\s().-]{8,}\d\b/,
];

/**
 * Evaluate whether a piece of content may be stored in long-lived memory.
 */
export function evaluateForStorage(content: string): MemoryDecision {
  if (content == null || content.trim().length === 0) {
    return { allowed: false, reason: 'empty', detail: 'Content is empty.' };
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: 'secret',
        detail: 'Content appears to contain a secret or credential.',
      };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: 'pii',
        detail: 'Content appears to contain personal data (PII).',
      };
    }
  }

  return { allowed: true };
}

/** Convenience guard: true only when storage is permitted. */
export function mayStore(content: string): boolean {
  return evaluateForStorage(content).allowed;
}
