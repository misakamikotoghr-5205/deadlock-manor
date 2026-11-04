import { scenarios } from './scenarios.js';

const METRIC_KEYS = ['availability', 'errorRate', 'latencyMs', 'saturation'];
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const round = value => Math.round(value * 10) / 10;

function scenarioFor(id) {
  if (!Object.hasOwn(scenarios, id)) throw new Error(`Unknown scenario: ${String(id)}`);
  return scenarios[id];
}

function normalizeMetrics(metrics) {
  for (const key of METRIC_KEYS) {
    metrics[key] = key === 'latencyMs'
      ? Math.round(clamp(metrics[key], 50, 10000))
      : round(clamp(metrics[key], 0, 100));
  }
}

function changeMetrics(state, changes) {
  for (const [key, amount] of Object.entries(changes)) state.metrics[key] += amount;
}

function healthy(state) {
  const gates = scenarioFor(state.scenarioId).successThresholds;
  return state.metrics.availability >= gates.availability
    && state.metrics.errorRate <= gates.errorRate
    && state.metrics.latencyMs <= gates.latencyMs
    && state.metrics.saturation <= gates.saturation;
}

function availability(state, action) {
  if (state.phase !== 'active') return { available: false, reason: 'This incident is finished. Start a new simulation.' };
  if (action.cost > state.budgetRemaining) return { available: false, reason: `Needs ${action.cost} budget; ${state.budgetRemaining} remains.` };
  if (!action.repeatable && state.actionsTaken.includes(action.id)) return { available: false, reason: 'This intervention has already been applied.' };
  if (action.id === 'close-circuit' && !state.systems.circuitOpen) return { available: false, reason: 'The payment circuit is already closed.' };
  return { available: true, reason: '' };
}

function updateCausalState(state) {
  if (state.scenarioId === 'bad-release') state.systems.rootCauseFixed = !state.systems.badReleaseActive;
  if (state.scenarioId === 'pool-exhaustion') state.systems.rootCauseFixed = !state.systems.leakActive && state.systems.sessionsCleared;
  if (state.scenarioId === 'retry-storm') state.systems.rootCauseFixed = state.systems.retryBudgeted;
}

function advanceEnvironment(state) {
  const systems = state.systems;
  if (state.scenarioId === 'bad-release' && systems.badReleaseActive) {
    if (systems.rolloutPaused) {
      changeMetrics(state, { availability: -0.5, errorRate: 0.5, latencyMs: 30, saturation: 1 });
      return 'The rollout is contained, but existing v2.7 instances still reject checkouts.';
    }
    systems.rolloutPercent = Math.min(100, systems.rolloutPercent + 10);
    changeMetrics(state, { availability: -1.5, errorRate: 2, latencyMs: 90, saturation: 3 });
    return `The automatic rollout reaches ${systems.rolloutPercent}% while the broken contract remains.`;
  }
  if (state.scenarioId === 'pool-exhaustion' && !systems.rootCauseFixed) {
    if (systems.leakActive) {
      changeMetrics(state, systems.admissionLimited
        ? { availability: -0.5, errorRate: 0.4, latencyMs: 65, saturation: 1.5 }
        : { availability: -2, errorRate: 1.5, latencyMs: 180, saturation: 5 });
      return systems.sessionsCleared
        ? 'New timeout requests begin leaking clients again; clearing sessions did not repair the handler.'
        : 'The timeout handler continues leaking clients into the occupied pool.';
    }
    changeMetrics(state, { availability: 0.3, errorRate: -0.2, latencyMs: -40, saturation: -1 });
    return 'The handler no longer leaks, but the previously abandoned sessions still occupy the pool.';
  }
  if (state.scenarioId === 'retry-storm' && systems.circuitOpen) {
    state.metrics.availability = Math.min(93, state.metrics.availability);
    changeMetrics(state, { errorRate: -0.5, latencyMs: -35, saturation: -4 });
    return 'The open circuit protects capacity. Payments remain deferred, so customer availability cannot recover fully.';
  }
  if (state.scenarioId === 'retry-storm' && !systems.retryBudgeted) {
    changeMetrics(state, { availability: -2, errorRate: 2.5, latencyMs: 220, saturation: 4 });
    return 'Immediate retries amplify provider traffic and grow the waiting queue.';
  }
  changeMetrics(state, { availability: 0.6, errorRate: -0.2, latencyMs: -25, saturation: -2 });
  return 'With the causal trigger removed, the service drains queued work and recovers.';
}

function releaseAction(state, id) {
  switch (id) {
    case 'pause-rollout':
      state.systems.rolloutPaused = true;
      return ['partial', 'New rollout steps stop. Existing v2.7 traffic is still broken.'];
    case 'rollback-release':
      state.systems.badReleaseActive = false;
      state.systems.rolloutPaused = true;
      state.systems.rolloutPercent = 0;
      state.metrics = clone(scenarios['bad-release'].healthyMetrics);
      return ['effective', 'The previous contract-compatible release replaces v2.7. Decoder errors stop.'];
    case 'add-capacity':
      changeMetrics(state, { saturation: -14, latencyMs: -100 });
      return ['ineffective', 'More CPU capacity is available, but every new v2.7 instance has the same decoder error.'];
    case 'purge-cache':
      changeMetrics(state, { latencyMs: 70, saturation: 4 });
      return ['ineffective', 'Fresh inventory responses contain the same renamed field. Cold-cache traffic adds work.'];
    case 'restart-fleet':
      changeMetrics(state, { availability: -13, errorRate: 7, latencyMs: 300, saturation: 8 });
      state.safetyPenalty += 8;
      return ['harmful', 'The fleet restarts into the same faulty release. Connection draining interrupts healthy customers.'];
    case 'mute-alerts':
      state.safetyPenalty += 5;
      return ['harmful', 'The pager is quiet. The customer-facing defect and automatic rollout are unchanged.'];
    default: throw new Error(`Unsupported release action: ${id}`);
  }
}

function poolAction(state, id) {
  switch (id) {
    case 'limit-concurrency':
      state.systems.admissionLimited = true;
      changeMetrics(state, { availability: 3, errorRate: -2, latencyMs: -350, saturation: -9 });
      return ['partial', 'Admission control reduces incoming pressure, while leaked connections remain occupied.'];
    case 'patch-client-lifecycle':
      state.systems.leakActive = false;
      if (state.systems.sessionsCleared) state.metrics = clone(scenarios['pool-exhaustion'].healthyMetrics);
      return [state.systems.sessionsCleared ? 'effective' : 'partial', 'The handler now rolls back and releases its client in finally. Existing orphans must also be reclaimed.'];
    case 'terminate-orphans':
      state.systems.sessionsCleared = true;
      state.metrics = state.systems.leakActive
        ? { availability: 96, errorRate: 2.5, latencyMs: 470, saturation: 53 }
        : clone(scenarios['pool-exhaustion'].healthyMetrics);
      return [state.systems.leakActive ? 'partial' : 'effective', 'The 64 identified orphan sessions are terminated; healthy sessions stay connected.'];
    case 'double-pool':
      state.systems.poolExpanded = true;
      changeMetrics(state, { saturation: -17, latencyMs: 130 });
      return ['partial', 'The larger limit buys headroom. It does not repair the leaking timeout path and adds database concurrency.'];
    case 'scale-workers':
      changeMetrics(state, { availability: -3, errorRate: 3, latencyMs: 260, saturation: 5 });
      state.safetyPenalty += 5;
      return ['harmful', 'Additional workers compete for the same exhausted database and can leak more clients.'];
    case 'restart-database':
      state.systems.sessionsCleared = true;
      changeMetrics(state, { availability: -18, errorRate: 10, latencyMs: 600, saturation: -22 });
      state.safetyPenalty += 10;
      return ['harmful', 'All clients disconnect, including healthy transactions. The application leak still needs a repair.'];
    default: throw new Error(`Unsupported pool action: ${id}`);
  }
}

function retryAction(state, id) {
  switch (id) {
    case 'open-circuit':
      state.systems.circuitOpen = true;
      state.systems.retryStormActive = false;
      state.metrics = { availability: 90, errorRate: 5, latencyMs: 450, saturation: 50 };
      return ['partial', 'The circuit stops provider calls and sheds queue pressure. Payments are deferred instead of completed.'];
    case 'budget-retries':
      state.systems.retryBudgeted = true;
      state.systems.retryStormActive = false;
      state.metrics = clone(scenarios['retry-storm'].healthyMetrics);
      if (state.systems.circuitOpen) state.metrics.availability = 92;
      return ['effective', 'A shared retry budget, exponential backoff, and jitter stop synchronized call amplification.'];
    case 'close-circuit':
      state.systems.circuitOpen = false;
      if (state.systems.retryBudgeted) {
        state.metrics = clone(scenarios['retry-storm'].healthyMetrics);
        return ['effective', 'The provider resumes under the bounded retry policy; completed payments recover.'];
      }
      state.systems.retryStormActive = true;
      state.metrics = { availability: 79, errorRate: 19, latencyMs: 2100, saturation: 88 };
      state.safetyPenalty += 5;
      return ['harmful', 'The circuit reopens before the retry policy is repaired. The same feedback loop returns.'];
    case 'shorten-timeout':
      changeMetrics(state, { availability: -5, errorRate: 6, latencyMs: 450, saturation: 5 });
      state.safetyPenalty += 5;
      return ['harmful', 'Attempts fail sooner and retry immediately. Provider call pressure increases.'];
    case 'scale-workers':
      changeMetrics(state, { availability: -2, errorRate: 4, latencyMs: 250, saturation: 4 });
      state.safetyPenalty += 5;
      return ['harmful', 'More workers create more concurrent attempts without bounding retry amplification.'];
    case 'drain-queue':
      changeMetrics(state, { availability: -5, errorRate: 8, latencyMs: 550, saturation: 6 });
      state.safetyPenalty += 8;
      return ['harmful', 'The unthrottled backlog hits the degraded provider as another synchronized burst.'];
    default: throw new Error(`Unsupported retry action: ${id}`);
  }
}

function scoreState(state) {
  const scenario = scenarioFor(state.scenarioId);
  const progress = METRIC_KEYS.map(key => {
    const start = scenario.initialMetrics[key];
    const target = scenario.successThresholds[key];
    // A metric already inside its recovery gate starts with its full share.
    // In particular, healthy CPU during a schema failure is not lost progress.
    if (key === 'availability' ? start >= target : start <= target) {
      return (key === 'availability' ? state.metrics[key] >= target : state.metrics[key] <= target) ? 1 : 0;
    }
    return clamp((state.metrics[key] - start) / (target - start), 0, 1);
  });
  const breakdown = {
    evidence: Math.min(15, state.evidenceRead.length * 4),
    stabilization: round(progress.reduce((a, b) => a + b, 0) / 4 * 35),
    causalRepair: state.systems.rootCauseFixed ? 25 : 0,
    verification: state.phase === 'resolved' ? 10 : 0,
    efficiency: state.phase === 'resolved'
      ? Math.max(0, 15 - Math.max(0, scenario.actionBudget - state.budgetRemaining - scenario.optimalCost) * 3)
      : 0,
    safetyPenalty: state.safetyPenalty,
  };
  breakdown.total = round(clamp(breakdown.evidence + breakdown.stabilization + breakdown.causalRepair
    + breakdown.verification + breakdown.efficiency - breakdown.safetyPenalty, 0, 100));
  state.scoreBreakdown = breakdown;
  state.score = breakdown.total;
}

function advice(state) {
  const read = new Set(state.evidenceRead);
  const fixed = state.systems.rootCauseFixed;
  let analyst;
  let skeptic;
  let commander;
  let recommendedActionId;
  if (state.scenarioId === 'bad-release') {
    analyst = read.has('release-diff') && read.has('error-trace')
      ? 'The failures follow v2.7 and a renamed response field. This is a release contract failure.'
      : 'Compare the deployment ledger with a failing trace before assuming the service needs capacity.';
    skeptic = state.systems.rolloutPaused && !fixed
      ? 'Pausing the rollout leaves the existing faulty instances online. Containment has not removed the trigger.'
      : 'CPU headroom and a successful inventory response can contradict a capacity diagnosis. Read both.';
    commander = 'Contain the rollout if needed, restore the compatible release, then run a synthetic checkout.';
    recommendedActionId = read.has('release-diff') && read.has('error-trace') ? 'rollback-release' : null;
  } else if (state.scenarioId === 'pool-exhaustion') {
    analyst = read.has('handler-review') && read.has('session-snapshot')
      ? 'The timeout path skips release, and the old idle transactions occupy the pool. Stop the leak and clear the orphans.'
      : 'Compare pool occupancy, query time, and the ages of idle transactions. Inspect the timeout handler.';
    skeptic = !state.systems.leakActive && !state.systems.sessionsCleared
      ? 'The code is repaired, but the old sessions still hold connections. Reclaim the confirmed orphans.'
      : state.systems.sessionsCleared && state.systems.leakActive
        ? 'Freeing connections is temporary while the handler keeps leaking them. Repair the lifecycle.'
        : 'A larger pool or more workers changes pressure; neither proves why connections stay checked out.';
    commander = 'Use admission control if needed. Repair the handler, reclaim orphan sessions, and verify a reservation.';
    recommendedActionId = read.has('handler-review')
      ? (state.systems.leakActive ? 'patch-client-lifecycle' : 'terminate-orphans') : null;
  } else {
    analyst = read.has('traffic-multiplier') && read.has('retry-policy')
      ? 'Four attempts per checkout explain the amplification. Bound retries and spread their timing with backoff and jitter.'
      : 'Compare incoming checkouts with provider attempts and read the retry policy. A growing queue can be feedback.';
    skeptic = state.systems.circuitOpen
      ? 'A quiet queue behind an open circuit still means deferred payments. Reopen only after the retry policy is safe.'
      : 'Adding workers or retrying sooner can increase provider pressure. Look for a bounded retry budget.';
    commander = fixed && state.systems.circuitOpen
      ? 'The retry policy is repaired. Close the payment circuit, then verify a completed payment.'
      : 'Protect the provider if needed, apply a bounded retry policy, and prove a completed payment.';
    recommendedActionId = fixed && state.systems.circuitOpen ? 'close-circuit'
      : read.has('retry-policy') ? 'budget-retries' : null;
  }
  if (fixed && !(state.scenarioId === 'retry-storm' && state.systems.circuitOpen)) {
    analyst = 'The causal repair is in place and the metrics are recovering. Measure the complete customer journey.';
    skeptic = 'Improved telemetry alone is not a recovery declaration. The synthetic transaction must pass every gate.';
    commander = 'Run the synthetic recovery check while enough action budget remains.';
    recommendedActionId = 'verify-recovery';
  }
  if (state.budgetRemaining <= 2 && !fixed && state.phase === 'active') {
    commander = `Only ${state.budgetRemaining} budget remains. Choose the causal repair supported by the evidence; containment alone cannot close the incident.`;
  }
  if (state.phase !== 'active') {
    analyst = state.phase === 'resolved' ? 'The causal trigger is removed and a synthetic customer journey passed.' : 'The incident ended before a verified recovery. Use the report to compare containment with repair.';
    skeptic = state.phase === 'resolved' ? 'Check the score audit and any collateral damage before calling the response complete.' : 'A low dashboard number or a muted alert cannot substitute for customer recovery.';
    commander = 'Review the timeline and replay the incident with a different sequence of interventions.';
    recommendedActionId = null;
  }
  const basis = [`Deterministic ${state.scenarioId} rule set`, `Turn ${state.turn}`, `${state.evidenceRead.length} evidence items read`];
  return [
    { role: 'analyst', name: 'The Analyst', position: 'Find the cause', message: analyst, basis: [...basis], engine: 'rules', recommendedActionId: null },
    { role: 'skeptic', name: 'The Skeptic', position: 'Challenge the theory', message: skeptic, basis: [...basis], engine: 'rules', recommendedActionId: null },
    { role: 'commander', name: 'The Commander', position: 'Choose the next move', message: commander, basis: [...basis], engine: 'rules', recommendedActionId },
  ];
}

function refresh(state) {
  scoreState(state);
  state.agents = advice(state);
  return state;
}

/** Return a new, JSON-serializable game. Advisors are rules, never an LLM. */
export function createGame(scenarioId) {
  const scenario = scenarioFor(scenarioId);
  return refresh({
    version: 1,
    scenarioId,
    phase: 'active',
    turn: 0,
    budgetRemaining: scenario.actionBudget,
    metrics: clone(scenario.initialMetrics),
    systems: clone(scenario.initialSystems),
    evidenceRead: [],
    actionsTaken: [],
    history: [],
    outcome: null,
    score: 0,
    scoreBreakdown: {},
    safetyPenalty: 0,
    agentMode: 'rules',
    agents: [],
  });
}

function inspectInternal(state, evidenceId) {
  if (state.phase !== 'active') throw new Error('This incident is finished. Start a new simulation.');
  const evidence = scenarioFor(state.scenarioId).evidence.find(item => item.id === evidenceId);
  if (!evidence) throw new Error(`Unknown evidence: ${String(evidenceId)}`);
  const next = clone(state);
  if (next.evidenceRead.includes(evidenceId)) return next;
  next.evidenceRead.push(evidenceId);
  const metrics = clone(state.metrics);
  next.history.push({
    id: `event-${next.history.length + 1}`, turn: next.turn, type: 'evidence',
    title: `Read: ${evidence.title}`, detail: evidence.summary,
    actionId: null, evidenceId, cost: 0, assessment: 'observed',
    metricsBefore: metrics, metricsAfter: clone(metrics),
    delta: { availability: 0, errorRate: 0, latencyMs: 0, saturation: 0 },
  });
  return refresh(next);
}

function applyInternal(state, actionId) {
  const scenario = scenarioFor(state.scenarioId);
  const action = scenario.actions.find(item => item.id === actionId);
  if (!action) throw new Error(`Unknown action: ${String(actionId)}`);
  const canApply = availability(state, action);
  if (!canApply.available) throw new Error(canApply.reason);
  const next = clone(state);
  const before = clone(state.metrics);
  next.turn += 1;
  next.budgetRemaining -= action.cost;
  next.actionsTaken.push(actionId);
  next.systems.verified = false;
  let assessment = 'ineffective';
  let detail = '';
  if (actionId !== 'verify-recovery') {
    const result = state.scenarioId === 'bad-release' ? releaseAction(next, actionId)
      : state.scenarioId === 'pool-exhaustion' ? poolAction(next, actionId) : retryAction(next, actionId);
    [assessment, detail] = result;
  }
  updateCausalState(next);
  const environment = advanceEnvironment(next);
  normalizeMetrics(next.metrics);
  if (actionId === 'verify-recovery') {
    next.systems.verified = next.systems.rootCauseFixed && healthy(next)
      && !(next.scenarioId === 'retry-storm' && next.systems.circuitOpen);
    assessment = next.systems.verified ? 'effective' : 'ineffective';
    detail = next.systems.verified
      ? 'The synthetic customer journey completes and every recovery gate passes.'
      : 'The synthetic check fails: the causal trigger, customer path, or recovery metrics are still unhealthy. Verification does not repair them.';
  }
  detail += ` ${environment}`;
  const delta = Object.fromEntries(METRIC_KEYS.map(key => [key, round(next.metrics[key] - before[key])]));
  next.history.push({
    id: `event-${next.history.length + 1}`, turn: next.turn, type: 'action',
    title: action.label, detail, actionId, evidenceId: null, cost: action.cost,
    assessment, metricsBefore: before, metricsAfter: clone(next.metrics), delta,
  });
  if (next.systems.verified && healthy(next)) {
    next.phase = 'resolved';
    next.outcome = {
      status: 'success', title: 'The manor is quiet again.',
      summary: 'You removed the causal trigger and verified a completed customer journey.',
      reason: 'verified-recovery', turn: next.turn,
    };
  } else if (next.metrics.availability <= 20 || next.metrics.errorRate >= 70 || next.metrics.latencyMs >= 7000) {
    next.phase = 'failed';
    next.outcome = {
      status: 'failure', title: 'The incident consumed the manor.',
      summary: 'Customer impact crossed the simulation’s critical safety boundary before verified recovery.',
      reason: 'critical-impact', turn: next.turn,
    };
  } else if (next.budgetRemaining === 0) {
    next.phase = 'failed';
    next.outcome = {
      status: 'failure', title: 'Dawn arrived before recovery.',
      summary: 'The action budget was exhausted before a causal repair and successful verification.',
      reason: 'budget-exhausted', turn: next.turn,
    };
  }
  return refresh(next);
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

/** Validate saved JSON by replaying the complete deterministic event history. */
export function validateGameState(value) {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return false;
    const scenario = scenarioFor(value.scenarioId);
    if (!Array.isArray(value.history) || value.history.length > scenario.actionBudget + scenario.evidence.length) return false;
    let replay = createGame(value.scenarioId);
    for (const event of value.history) {
      if (!event || typeof event !== 'object') return false;
      if (event.type === 'evidence') replay = inspectInternal(replay, event.evidenceId);
      else if (event.type === 'action') replay = applyInternal(replay, event.actionId);
      else return false;
    }
    return canonical(value) === canonical(replay);
  } catch {
    return false;
  }
}

function assertState(state) {
  if (!validateGameState(state)) throw new Error('Invalid game state. Start a new simulation or restore an unchanged version 1 save.');
}

/** Reading evidence is free, idempotent, and does not advance the environment. */
export function inspectEvidence(state, evidenceId) {
  assertState(state);
  return inspectInternal(state, evidenceId);
}

/** Apply one intervention, spend its cost, and advance the world one turn. */
export function applyAction(state, actionId) {
  assertState(state);
  return applyInternal(state, actionId);
}

/** Includes unavailable actions with a human-readable reason for the UI. */
export function getAvailableActions(state) {
  assertState(state);
  return scenarioFor(state.scenarioId).actions.map(action => ({ ...clone(action), ...availability(state, action) }));
}

/** Exportable, auditable report. The diagnosis and lessons unlock at the end. */
export function getReport(state) {
  assertState(state);
  const scenario = scenarioFor(state.scenarioId);
  const finished = state.phase !== 'active';
  return {
    version: 1,
    title: `${scenario.title} — incident report`,
    scenarioId: state.scenarioId,
    outcome: clone(state.outcome),
    phase: state.phase,
    rootCause: finished ? scenario.rootCause : 'Investigation in progress. The final diagnosis unlocks when the simulation ends.',
    score: state.score,
    scoreBreakdown: clone(state.scoreBreakdown),
    scoreFormula: 'evidence + stabilization + causalRepair + verification + efficiency − safetyPenalty; clamped to 0–100',
    grade: !finished ? 'In progress' : state.phase === 'failed' ? 'Unresolved'
      : state.score >= 90 ? 'A' : state.score >= 75 ? 'B' : state.score >= 60 ? 'C' : 'D',
    turns: state.turn,
    budgetRemaining: state.budgetRemaining,
    budgetSpent: scenario.actionBudget - state.budgetRemaining,
    metrics: clone(state.metrics),
    recoveryGates: clone(scenario.successThresholds),
    timeline: clone(state.history),
    findings: state.evidenceRead.map(id => {
      const evidence = scenario.evidence.find(item => item.id === id);
      return { id, title: evidence.title, summary: evidence.summary, signals: [...evidence.signals] };
    }),
    lessons: finished ? [...scenario.lessons] : [],
    agentMode: 'rules',
    agentDisclosure: 'Three deterministic rule-based advisors. No LLM, API calls, or autonomous external actions are used.',
    agents: clone(state.agents),
    modelLimitations: 'A fictional deterministic training model: one action advances one turn, costs are abstract response effort, and metrics are modeled rather than sampled from production.',
  };
}
