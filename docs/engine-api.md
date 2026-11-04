# Simulation API

`simulation.js` and `scenarios.js` are browser ES modules with no dependencies, network requests, clock reads, random numbers, or LLM calls. Three advisors use disclosed deterministic rules. This is a fictional training model rather than a production incident controller.

```js
import { scenarios } from './scenarios.js';
import {
  createGame, inspectEvidence, applyAction,
  getAvailableActions, getReport, validateGameState,
} from './simulation.js';

let game = createGame('bad-release');
game = inspectEvidence(game, 'release-diff');
game = applyAction(game, 'rollback-release');
game = applyAction(game, 'verify-recovery');
const report = getReport(game);
```

## Scenarios

`scenarios` is an object keyed by `bad-release`, `pool-exhaustion`, and `retry-storm`; `scenarioList` is the same catalog as an array. Each scenario contains `title`, `subtitle`, `summary`, `difficulty`, `briefing`, `actionBudget`, `initialMetrics`, `successThresholds`, `evidence`, `actions`, `learningObjectives`, `rootCause`, and `lessons`.

An evidence item has `{ id, title, type, summary, content, signals }`. `content` is a multiline string; `signals` is a string array. An action has `{ id, label, description, cost, risk, repeatable? }`; `risk` is `low`, `medium`, or `high`. The catalog is available to the UI; its diagnosis is deliberately hidden by the UI until an incident ends, rather than protected as a secret.

## State and transitions

`createGame(scenarioId)` returns a complete JSON-serializable state. Relevant fields:

| Field | Meaning |
| --- | --- |
| `version` | Save schema, currently `1` |
| `scenarioId` | Catalog key |
| `phase` | `active`, `resolved`, or `failed` |
| `turn` | Number of applied interventions, not their total cost |
| `budgetRemaining` | Abstract response effort remaining; never negative |
| `metrics` | `{ availability, errorRate, latencyMs, saturation }`; percentages except milliseconds |
| `systems` | Scenario-specific serializable causal flags, including `rootCauseFixed` and `verified` |
| `evidenceRead` / `actionsTaken` | Ordered arrays of IDs |
| `history` | Auditable evidence and action events |
| `outcome` | `null`, or `{ status, title, summary, reason, turn }` with status `success` / `failure` |
| `score` / `scoreBreakdown` | Current 0–100 score and its audit |
| `agents` | Analyst, skeptic, commander messages with rule provenance |
| `agentMode` | Always `rules` |

`inspectEvidence(state, evidenceId)` returns a new state, costs no budget, and does not advance a turn or the environment. Re-reading an item is idempotent. It records evidence in the audit and refreshes rule advice.

`applyAction(state, actionId)` returns a new state. It spends the action’s cost, advances one turn, applies the intervention, advances the causal environment, records metric deltas, then evaluates recovery and failure. Interventions cost one or two effort units, independently of their one-turn duration. Every route is deterministic. No transition mutates its input.

Repair alone does not win: the service must pass all scenario-specific metric gates and a separate synthetic verification action. Containment alone cannot remove the root cause. In the pool scenario, lifecycle repair and reclaiming existing orphan sessions are both required. In the retry scenario, the circuit must be closed after the policy is repaired to complete payments.

Verified recovery wins even when it uses the final budget unit. Otherwise zero budget fails the incident. Availability ≤20%, errors ≥70%, or modeled latency ≥7,000 ms also ends it as critical customer impact. Both evidence inspection and mitigation reject finished games; reports remain readable.

`getAvailableActions(state)` returns **all** action definitions with `available: boolean` and `reason: string`. Already applied nonrepeatable interventions, actions exceeding the budget, a closed circuit’s close action, and all terminal actions are unavailable. Recovery verification can be retried. Unavailable actions throw if applied.

Every history event contains `{ id, turn, type, title, detail, actionId, evidenceId, cost, assessment, metricsBefore, metricsAfter, delta }`. IDs are sequential `event-N`; `type` is `evidence` or `action`; `assessment` is `observed`, `effective`, `partial`, `ineffective`, or `harmful`. The unused action/evidence ID is `null`. `delta` always means after minus before, so a negative error/latency delta is an improvement.

## Save validation and errors

All public readers and transitions validate the state. Unknown IDs, unavailable actions, invalid saves, and transitions after an ending throw `Error`. `validateGameState(value)` instead returns a boolean, including for malformed input. It deterministically replays the event history and compares the **whole** reconstructed state, rejecting changes to budgets, metrics, score, causal flags, event IDs, or extra fields. `JSON.parse(JSON.stringify(game))` is a valid saved state. JSON object key order is irrelevant.

This guards accidental save corruption and inconsistent local state. It is not a security or anti-cheat boundary: a user controls the browser and can generate a different legitimate action history. New rules or schema changes may invalidate older saves.

## Reports and scoring

`getReport(state)` returns a detached JSON object with the outcome, score audit, timeline, metrics, recovery gates, evidence findings, and advisor disclosure. The final root cause and lessons unlock at either ending. Active reports label the diagnosis as in progress.

The score formula is `evidence + stabilization + causalRepair + verification + efficiency − safetyPenalty`, clamped to 0–100:

- Evidence: 4 per unique item, capped at 15.
- Stabilization: up to 35, averaging progress from the initial metrics to each recovery threshold; each metric’s contribution is capped at its target. Metrics already inside their gate start with their full share while healthy.
- Causal repair: 25 after the scenario’s required underlying fixes.
- Verification: 10 for a successful ending.
- Efficiency: 15 on a successful optimal-cost route, minus 3 per extra effort unit; never below zero. Failed/open incidents receive zero efficiency points.
- Safety penalty: explicit penalties for disruptive or counterproductive choices, retained in the audit.

Reading all evidence and taking an optimal, safe route earns 100. Reports include the scenario’s limitations: modeled observations, abstract effort, and no real infrastructure execution.
