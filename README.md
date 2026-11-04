# Deadlock Manor

A haunted incident-response game: read logs, challenge the diagnosis, spend your response budget, and prove recovery. Three fictional outages teach causal debugging through decisions that change the simulation.

## Run locally

Node 22 or newer; no dependencies to install:

```bash
npm run dev
# Open http://127.0.0.1:4173
npm test
npm run check
npm run build
```

`dist/` is a portable static website. Serve it with any static HTTP server; ES modules require HTTP rather than opening index.html directly as a file.

## What works

- **The Phantom Release:** compare deployment and trace evidence, revert an incompatible schema change, then verify a real customer journey.
- **The Connection Crypt:** diagnose leaked database connections, repair the source and reclaim the pool.
- **The Echoing Ballroom:** contain a retry storm, correct the retry policy, safely reopen the circuit and verify recovery.
- An Analyst, Skeptic, and Commander respond to evidence and actions with transparent deterministic rules. These advisers are **not LLMs** and make no network calls.
- Immutable state transitions, bounded action capacity, meaningful side effects, success/failure endings, an auditable score and causal postmortem.
- Browser autosave validated by replaying history; desktop/mobile layouts, keyboard navigation, and Markdown/JSON report downloads.

All content and artwork are original, fictional, and self-contained. There is no production monitoring or external service integration.

## Architecture

`scenarios.js` contains content and recovery thresholds. `simulation.js` owns pure transitions, adviser rules, scoring, and replay validation. `app.js` handles rendering, focus, persistence and exports. `scripts/build.mjs` copies an explicit allowlist to `dist/`. The development server only serves public app files. [Engine API](docs/engine-api.md) documents the contract.

Verification: 17 Node tests cover causal winning/losing routes, immutability, budget integrity, invalid actions, tampered saves, restartability and terminal-state invariants. Browser QA on 2026-11-04 covered evidence dialogs, a complete repair/verify route, saved-session restoration and a 390px mobile viewport with no horizontal overflow or console warnings/errors.

## Kiroween 2026 status

Prepared for the **Costume Contest** category. See [competition requirements](docs/competition.md) and the [under-three-minute demo script](docs/demo-script.md).

This implementation was developed by a coordinated Codex agent team: engine, UI, independent QA, integration and publishing. `.kiro/` contains project specs and steering prepared by that team. **They are not evidence of completed Kiro development.** Kiro CLI 3.0.0 was installed and a real noninteractive review was attempted, but authentication was absent. [Usage status](docs/kiro-usage.md) records the result accurately. Actual authenticated Kiro contribution, a public YouTube demo, public reviewer access to the running app, and Devpost registration/submission remain to be completed. No contest entry was submitted.

MIT licensed.
