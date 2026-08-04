# Certy GH-600 - Memory and State Lab

A public, fully runnable and tested TypeScript training repo for the
**GH-600 GitHub Agentic AI Developer** course, module **3.0 - Memory, State
and GitHub Context**.

Built by [Certy](https://certy.pro) (Coded Vision Design). Part of the
[CertyPro](https://github.com/CertyPro) course materials.

## What this lab teaches

Memory is not "store everything". A capable agent decides what to remember,
never stores secrets, survives across tasks, and resumes from checkpoints.
In multi-agent workflows it locks shared state so two agents never write it at
once.

The repo is **deterministic**: no API keys, no network, no model calls. Every
behaviour is reproducible and covered by tests.

## Contents

| Area   | Files                                                                   |
| ------ | ----------------------------------------------------------------------- |
| Memory | `src/memory/` - short-term buffer, episodic log, semantic recall, policy gate, JSON store |
| State  | `src/state/` - workflow status machine, serialiser, in-memory lock, checkpoints |
| Tests  | `tests/` - memory policy and recall, state locking, serialise round-trip |
| Docs   | `docs/` - architecture, serialisation, retention, privacy                |
| Labs   | `labs/README.md` - eight guided exercises                                |
| Examples | `examples/` - sample episodic run records                              |

## Run it

Requires Node.js 22 or newer.

```bash
npm install --no-fund --no-audit
npm test        # run the test suite
npm run typecheck  # strict TypeScript, no emit
```

## Continuous integration

`.github/workflows/ci.yml` runs install, test and typecheck on every push and
pull request to `main`. `.github/dependabot.yml` keeps npm and GitHub Actions
dependencies up to date weekly.

## Links

- Certy: https://certy.pro
- Course content: https://github.com/CertyPro/certy-gh600-course-content
- CertyPro organisation: https://github.com/CertyPro

## Licence

MIT - see [LICENSE](./LICENSE). British English is used throughout.
