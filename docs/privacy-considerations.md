# Privacy considerations

Agent memory is a new place for sensitive data to leak. A token written into
episodic memory can be replayed, serialised into an artefact, and read by the
next agent. Treat memory with the same care as a log file - because that is
effectively what it is.

## What must never be stored

- **Secrets and credentials**: access tokens, API keys, passwords, private
  keys. The policy gate blocks GitHub-style tokens (`ghp_...`), AWS access key
  ids, `*_TOKEN`/`*_SECRET`/`*_KEY` assignments, private-key blocks, and the
  deliberate training fixture `GHAS_TRAINING_FAKE_TOKEN_DO_NOT_USE_123`.
- **Personal data (PII)**: email addresses, phone numbers, and other directly
  identifying details about real people.

`src/memory/memoryPolicy.ts` implements these checks with deterministic
regular expressions. `evaluateForStorage` returns a reason (`secret`, `pii`,
or `empty`) and a safe detail string that never echoes the offending value
back into a log.

## Principles

1. **Default deny for risky content.** If a value matches a secret or PII
   pattern, it is rejected. Better a false positive than a leaked token.
2. **Never log the secret.** Rejection messages describe the category, not the
   value.
3. **Minimise.** Store the smallest useful summary, not raw payloads. A run
   record needs "fixed the off-by-one in pagination", not the full diff.
4. **Redact at the source.** If you must reference a credential, store a
   reference (an env var name, a secret id) - never the value.
5. **Keep secrets in secret stores.** Use GitHub Actions secrets and
   environment variables. The `.gitignore` excludes `.env` files for the same
   reason.

## Limitations

The regex gate is a teaching baseline, not a complete data-loss-prevention
system. In production, combine it with secret scanning (such as GitHub secret
scanning / push protection), allow-lists for what may be stored, and human
review of retention policies.
