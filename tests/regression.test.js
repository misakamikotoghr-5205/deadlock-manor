import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../scenarios.js';
import { createGame, inspectEvidence, applyAction, getAvailableActions, getReport, validateGameState } from '../simulation.js';

const jsonCopy = value => JSON.parse(JSON.stringify(value));

test('a JSON save can resume at every investigation prefix without changing its future', () => {
  const paths = {
    'bad-release': ['pause-rollout', 'rollback-release', 'verify-recovery'],
    'pool-exhaustion': ['terminate-orphans', 'patch-client-lifecycle', 'verify-recovery'],
    'retry-storm': ['open-circuit', 'budget-retries', 'close-circuit', 'verify-recovery'],
  };
  for (const [scenarioId, actions] of Object.entries(paths)) {
    let uninterrupted = createGame(scenarioId);
    let resumed = jsonCopy(uninterrupted);
    for (const evidence of scenarios[scenarioId].evidence) {
      uninterrupted = inspectEvidence(uninterrupted, evidence.id);
      resumed = jsonCopy(inspectEvidence(resumed, evidence.id));
      assert.equal(validateGameState(resumed), true);
      assert.deepEqual(resumed, uninterrupted);
    }
    for (const action of actions) {
      uninterrupted = applyAction(uninterrupted, action);
      resumed = jsonCopy(applyAction(resumed, action));
      assert.equal(validateGameState(resumed), true);
      assert.deepEqual(resumed, uninterrupted);
    }
    assert.equal(resumed.phase, 'resolved');
    assert.deepEqual(getReport(resumed), getReport(uninterrupted));
  }
});

test('tampered saves cannot buy capacity, erase penalties, forge evidence, or rewrite an outcome', () => {
  const initial = applyAction(inspectEvidence(createGame('bad-release'), 'release-diff'), 'restart-fleet');
  const edits = [
    state => { state.budgetRemaining += 1; },
    state => { state.budgetRemaining = 1.5; },
    state => { state.safetyPenalty = 0; },
    state => { state.metrics.availability = 100; },
    state => { state.systems.rootCauseFixed = true; },
    state => { state.evidenceRead.push('error-trace'); },
    state => { state.history[1].cost = 0; },
    state => { state.history[1].metricsAfter.availability = 100; },
    state => { state.history.reverse(); },
    state => { state.history.splice(0, 1); },
    state => { state.agents[0].message = 'Everything has been repaired.'; },
    state => { state.phase = 'resolved'; state.outcome = { status: 'success' }; },
    state => { state.scoreBreakdown.total = 100; state.score = 100; },
    state => { state.unknownExtension = true; },
  ];
  for (const edit of edits) {
    const changed = jsonCopy(initial);
    edit(changed);
    assert.equal(validateGameState(changed), false);
    assert.throws(() => applyAction(changed, 'verify-recovery'), /Invalid game state/);
  }
  assert.equal(validateGameState(initial), true);
});

test('validator treats malformed values and bounded-history violations as invalid without throwing', () => {
  const circular = createGame('bad-release');
  circular.circular = circular;
  const excessive = createGame('bad-release');
  excessive.history = Array(1000).fill({ type: 'evidence', evidenceId: 'release-diff' });
  const duplicate = inspectEvidence(createGame('bad-release'), 'release-diff');
  duplicate.history.push(jsonCopy(duplicate.history[0]));
  const missing = createGame('bad-release');
  delete missing.systems;
  for (const value of [null, undefined, false, 1, 'save', [], {}, circular, excessive, duplicate, missing]) {
    assert.doesNotThrow(() => assert.equal(validateGameState(value), false));
  }
  const reordered = Object.fromEntries(Object.entries(createGame('bad-release')).reverse());
  assert.equal(validateGameState(reordered), true, 'JSON property order does not invalidate a real save');
});

test('both successful and failed terminal states reject further work and stay recoverable', () => {
  const success = applyAction(applyAction(createGame('bad-release'), 'rollback-release'), 'verify-recovery');
  let failure = createGame('bad-release');
  while (failure.phase === 'active') failure = applyAction(failure, 'verify-recovery');
  assert.equal(failure.phase, 'failed');
  for (const terminal of [success, failure]) {
    const before = jsonCopy(terminal);
    assert.equal(validateGameState(jsonCopy(terminal)), true);
    assert.throws(() => inspectEvidence(terminal, 'release-diff'), /finished/);
    assert.throws(() => applyAction(terminal, 'verify-recovery'), /finished/);
    const actions = getAvailableActions(terminal);
    assert.equal(actions.every(action => !action.available && action.reason.length > 0), true);
    const report = getReport(terminal);
    report.metrics.availability = -100;
    report.timeline.length = 0;
    assert.deepEqual(terminal, before, 'rejected operations and report mutations leave the saved terminal state unchanged');
  }
});
