import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  inspectEvidence,
  applyAction,
  validateGameState,
} from "../simulation.js";
import {
  getReplayCheckpoints,
  replayCheckpoint,
  previewAlternative,
} from "../replay.js";

for (const [scenarioId, first, second, alternative] of [
  ["bad-release", "pause-rollout", "rollback-release", "add-capacity"],
  [
    "pool-exhaustion",
    "limit-concurrency",
    "patch-client-lifecycle",
    "double-pool",
  ],
  ["retry-storm", "open-circuit", "budget-retries", "scale-workers"],
])
  test(`${scenarioId}: checkpoint and one-step comparison replay the same real history`, () => {
    let source = createGame(scenarioId);
    const evidence = {
      "bad-release": ["release-diff", "error-trace"],
      "pool-exhaustion": ["pool-dashboard", "handler-review"],
      "retry-storm": ["traffic-multiplier", "retry-policy"],
    }[scenarioId];
    source = inspectEvidence(source, evidence[0]);
    source = applyAction(source, first);
    source = inspectEvidence(source, evidence[1]);
    source = applyAction(source, second);
    const beforeJson = JSON.stringify(source),
      checkpoints = getReplayCheckpoints(source);
    assert.equal(checkpoints.length, 2);
    const checkpoint = replayCheckpoint(source, 0);
    assert.equal(checkpoint.before.turn, 0);
    assert.deepEqual(checkpoint.before.evidenceRead, [evidence[0]]);
    assert.deepEqual(
      checkpoint.originalAfter.history.at(-1),
      source.history.find((event) => event.type === "action"),
    );
    const preview = previewAlternative(source, 0, alternative);
    assert.equal(preview.alternativeAfter.turn, preview.originalAfter.turn);
    assert.deepEqual(
      preview.alternativeAfter.evidenceRead,
      checkpoint.before.evidenceRead,
    );
    assert.equal(validateGameState(preview.alternativeAfter), true);
    assert.equal(JSON.stringify(source), beforeJson);
    preview.originalAction.metricsBefore.availability = -1;
    assert.equal(JSON.stringify(source), beforeJson);
    for (const key of Object.keys(source.metrics))
      assert.ok(
        Math.abs(
          preview.metricsDelta[key] -
            (preview.alternativeAfter.metrics[key] -
              preview.originalAfter.metrics[key]),
        ) < 0.001,
      );
    const secondPoint = replayCheckpoint(source, 1);
    assert.deepEqual(secondPoint.before.evidenceRead, evidence);
    assert.equal(secondPoint.before.turn, 1);
  });
test("replay rejects forged histories, out-of-range checkpoints and unavailable actions", () => {
  let source = createGame("bad-release");
  source = applyAction(source, "pause-rollout");
  source = applyAction(source, "rollback-release");
  source = applyAction(source, "verify-recovery");
  assert.equal(source.phase, "resolved");
  assert.equal(getReplayCheckpoints(source).length, 3);
  assert.throws(() => replayCheckpoint(source, -1));
  assert.throws(() => replayCheckpoint(source, 3));
  assert.throws(() => replayCheckpoint({ ...source, budgetRemaining: 99 }, 0));
  assert.throws(() => previewAlternative(source, 1, "pause-rollout"));
  assert.throws(() => previewAlternative(source, 0, "unknown-action"));
  const identical = previewAlternative(source, 0, "pause-rollout");
  assert.deepEqual(identical.metricsDelta, {
    availability: 0,
    errorRate: 0,
    latencyMs: 0,
    saturation: 0,
  });
});
