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

Verification: 27 Node tests cover causal winning/losing routes, immutability, budget integrity, invalid actions, tampered saves, restartability, terminal-state invariants and actual app persistence handlers with injected storage failures. Browser QA on 2026-11-04 covered evidence dialogs, a complete repair/verify route, saved-session restoration and a 390px mobile viewport with no horizontal overflow or console warnings/errors. The November 9 public GitHub Pages browser session also exercised the Phantom Release route, one-step comparison, explicit alternative continuation and return to the original shift; this is not a manual browser test of injected storage failures.

## Kiroween 2026 status

Submitted to **Kiroween 2026 / Costume Contest** on November 10, 2026. See [competition requirements](docs/competition.md) and the [under-three-minute demo script](docs/demo-script.md).

The original implementation was developed by coordinated Codex agents. `.kiro/` contains specs and steering prepared by that team; **those files are not Kiro-authored work**. On November 9, an authenticated official Kiro CLI 3.0.0 session completed a real, read-only review of replay restoration and partial localStorage failures. Codex reproduced two warning problems from its suggestions, rejected a speculative aliasing claim, and implemented the minimal fixes and regression tests. Codex independently found and repaired a related backup-deletion ordering bug; that finding is not attributed to Kiro. See [the exact usage and review assessment](docs/kiro-usage.md). The [public game](https://misakamikotoghr-5205.github.io/deadlock-manor/) is available without an account. On November 10, the latest Markdown Story and Additional Info were saved; revisiting Additional Info verified persistence of the repository and game URLs, testing instructions, Kiro-use explanation and reuse disclosure. The four participant-only answers and video URL have now been saved and checked. After the participant's action-time rules consent, final Submit succeeded on November 10. The [official project page](https://devpost.com/software/deadlock-manor) displayed “Project submitted!” and “Submitted to Kiroween 2026”. The [submission record](docs/local-demo-20261109.json) pins the submitted source revision to 3227460b00c98701b813c6c82ea09a82e8f7281c; later status-documentation commits are separate. This is a received entry, not a claim that organizer eligibility review or judging has passed. The [146.8-second video](https://youtu.be/L3BpOsPHobo) was publicly published on YouTube on November 10. It is an edit of actual browser screenshots, not continuous recording. Public publication does not establish anonymous player playback or organizer acceptance.

MIT licensed.

## Causal replay lab

After a shift ends, select a recorded decision and preview another intervention from the exact same evidence, budget, and system state. The comparison shows one-turn metrics and an exportable comparison; it does not rank full recovery paths. Continue the alternative explicitly, then return to your saved original shift. See [the source comparison and implementation notes](docs/landscape.md).
