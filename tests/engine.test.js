import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../scenarios.js';
import { createGame, inspectEvidence, applyAction, getAvailableActions, getReport, validateGameState } from '../simulation.js';

function readAll(state) {
  return scenarios[state.scenarioId].evidence.reduce((game, item) => inspectEvidence(game, item.id), state);
}

const solutions = {
  'bad-release': ['rollback-release', 'verify-recovery'],
  'pool-exhaustion': ['patch-client-lifecycle', 'terminate-orphans', 'verify-recovery'],
  'retry-storm': ['budget-retries', 'verify-recovery'],
};

for (const [scenarioId, actions] of Object.entries(solutions)) {
  test(`${scenarioId}: evidence-backed causal repair and verification produce an auditable win`, () => {
    let state = readAll(createGame(scenarioId));
    const snapshots = [];
    for (const action of actions) {
      snapshots.push(JSON.stringify(state));
      const previous = state;
      state = applyAction(state, action);
      assert.equal(JSON.stringify(previous), snapshots.at(-1), 'transition must not mutate input');
      assert.ok(validateGameState(JSON.parse(JSON.stringify(state))));
    }
    assert.equal(state.phase, 'resolved');
    assert.equal(state.outcome.status, 'success');
    assert.equal(state.outcome.reason, 'verified-recovery');
    assert.equal(state.systems.rootCauseFixed, true);
    assert.equal(state.systems.verified, true);
    assert.equal(state.score, 100, 'all evidence, optimal route and no collateral harm earn 100');
    const report = getReport(state);
    const b = report.scoreBreakdown;
    assert.equal(b.evidence + b.stabilization + b.causalRepair + b.verification + b.efficiency - b.safetyPenalty, report.score);
    assert.equal(report.timeline.filter(event => event.type === 'action').length, actions.length);
    assert.equal(report.grade, 'A');
    assert.equal(report.rootCause, scenarios[scenarioId].rootCause);
    assert.ok(report.lessons.length >= 3);
    assert.equal(report.agentMode, 'rules');
  });
}

test('reading evidence is free, immutable, and idempotent', () => {
  const initial = createGame('bad-release');
  const initialJson = JSON.stringify(initial);
  const read = inspectEvidence(initial, 'release-diff');
  assert.equal(JSON.stringify(initial), initialJson);
  assert.deepEqual(read.metrics, initial.metrics);
  assert.equal(read.budgetRemaining, initial.budgetRemaining);
  assert.equal(read.turn, 0);
  assert.equal(read.score, initial.score + 4);
  assert.deepEqual(inspectEvidence(read, 'release-diff'), read);
  assert.equal(read.history.length, 1);
});

test('pausing a rollout contains spread but leaves the bad version and cannot verify recovery', () => {
  let state = applyAction(createGame('bad-release'), 'pause-rollout');
  assert.equal(state.systems.rolloutPercent, 45);
  assert.equal(state.systems.badReleaseActive, true);
  assert.equal(state.systems.rootCauseFixed, false);
  state = applyAction(state, 'verify-recovery');
  assert.equal(state.phase, 'active');
  assert.equal(state.systems.verified, false);
  assert.equal(state.history.at(-1).assessment, 'ineffective');
  assert.equal(getAvailableActions(state).find(a => a.id === 'pause-rollout').available, false);
});

test('pool repair and reclaim are both necessary, and either order is supported', () => {
  for (const route of [
    ['patch-client-lifecycle', 'terminate-orphans'],
    ['terminate-orphans', 'patch-client-lifecycle'],
  ]) {
    let state = createGame('pool-exhaustion');
    state = applyAction(state, route[0]);
    assert.equal(state.systems.rootCauseFixed, false);
    const failedCheck = applyAction(state, 'verify-recovery');
    assert.equal(failedCheck.systems.verified, false);
    assert.equal(failedCheck.phase, 'active');
    state = applyAction(state, route[1]);
    assert.equal(state.systems.rootCauseFixed, true);
    state = applyAction(state, 'verify-recovery');
    assert.equal(state.phase, 'resolved');
  }
});

test('an open circuit is protective degradation; repaired retries and a closed circuit are needed', () => {
  let state = applyAction(createGame('retry-storm'), 'open-circuit');
  state = applyAction(state, 'budget-retries');
  assert.equal(state.systems.rootCauseFixed, true);
  assert.equal(state.systems.circuitOpen, true);
  state = applyAction(state, 'verify-recovery');
  assert.equal(state.systems.verified, false);
  assert.ok(state.metrics.availability <= 93);
  state = applyAction(state, 'close-circuit');
  state = applyAction(state, 'verify-recovery');
  assert.equal(state.phase, 'resolved');
  assert.equal(state.scoreBreakdown.efficiency, 6, 'three extra effort units cost 9 efficiency points');
});

test('closing an unsafe circuit revives the storm and records collateral risk', () => {
  let state = applyAction(createGame('retry-storm'), 'open-circuit');
  state = applyAction(state, 'close-circuit');
  assert.equal(state.systems.retryStormActive, true);
  assert.equal(state.systems.rootCauseFixed, false);
  assert.equal(state.history.at(-1).assessment, 'harmful');
  assert.equal(state.scoreBreakdown.safetyPenalty, 5);
});

test('spending the final budget on verification may win; spending it without repair loses', () => {
  let failed = createGame('bad-release');
  while (failed.phase === 'active') failed = applyAction(failed, 'verify-recovery');
  assert.equal(failed.budgetRemaining, 0);
  assert.equal(failed.phase, 'failed');
  assert.equal(failed.outcome.reason, 'budget-exhausted');
  assert.equal(failed.turn, scenarios['bad-release'].actionBudget);

  let exact = createGame('bad-release');
  for (const id of ['pause-rollout', 'add-capacity', 'purge-cache', 'mute-alerts', 'rollback-release', 'verify-recovery']) {
    exact = applyAction(exact, id);
  }
  assert.equal(exact.budgetRemaining, 0);
  assert.equal(exact.phase, 'resolved');
});

test('budget constraints expose reasons and rejected actions leave the input unchanged', () => {
  let state = createGame('bad-release');
  for (let i = 0; i < 6; i += 1) state = applyAction(state, 'verify-recovery');
  const rollback = getAvailableActions(state).find(a => a.id === 'rollback-release');
  assert.equal(rollback.available, false);
  assert.match(rollback.reason, /Needs 2 budget/);
  const before = JSON.stringify(state);
  assert.throws(() => applyAction(state, 'rollback-release'), /Needs 2 budget/);
  assert.equal(JSON.stringify(state), before);
});

test('invalid scenario, evidence, and actions are rejected', () => {
  assert.throws(() => createGame('haunted-typo'), /Unknown scenario/);
  const state = createGame('bad-release');
  assert.throws(() => inspectEvidence(state, 'not-real'), /Unknown evidence/);
  assert.throws(() => applyAction(state, 'not-real'), /Unknown action/);
  assert.throws(() => applyAction({}, 'rollback-release'), /Invalid game state/);
});

test('reports do not expose the final diagnosis before the incident ends and are detached copies', () => {
  const state = inspectEvidence(createGame('bad-release'), 'error-trace');
  const report = getReport(state);
  assert.notEqual(report.rootCause, scenarios['bad-release'].rootCause);
  assert.deepEqual(report.lessons, []);
  report.metrics.availability = 0;
  report.timeline[0].detail = 'changed';
  report.findings[0].signals.push('changed');
  assert.equal(state.metrics.availability, 78);
  assert.notEqual(state.history[0].detail, 'changed');
  assert.ok(validateGameState(state));
});

test('advisors are deterministic rules with visible provenance and no external dependencies', () => {
  const a = inspectEvidence(createGame('retry-storm'), 'retry-policy');
  const b = inspectEvidence(createGame('retry-storm'), 'retry-policy');
  assert.deepEqual(a, b);
  assert.equal(a.agentMode, 'rules');
  assert.deepEqual(a.agents.map(agent => agent.role), ['analyst', 'skeptic', 'commander']);
  for (const agent of a.agents) {
    assert.equal(agent.engine, 'rules');
    assert.ok(agent.message.length > 30);
    assert.ok(agent.basis[0].startsWith('Deterministic'));
  }
});
