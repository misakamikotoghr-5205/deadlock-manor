import {
  createGame,
  inspectEvidence,
  applyAction,
  getAvailableActions,
  validateGameState,
} from "./simulation.js";

function assertSource(source) {
  if (!validateGameState(source))
    throw new Error("A replay needs an unchanged, valid incident history.");
}

/** Checkpoints refer to actions, never to the evidence discovered later. */
export function getReplayCheckpoints(source) {
  assertSource(source);
  return source.history
    .filter((event) => event.type === "action")
    .map((event, index) => ({
      index,
      turn: event.turn,
      actionId: event.actionId,
      title: event.title,
    }));
}

/** Reconstruct exactly the state before one recorded action. Source is immutable. */
export function replayCheckpoint(source, actionIndex) {
  assertSource(source);
  if (!Number.isInteger(actionIndex) || actionIndex < 0)
    throw new Error("Choose a recorded action checkpoint.");
  let replay = createGame(source.scenarioId);
  let index = 0;
  for (const event of source.history) {
    if (event.type === "evidence")
      replay = inspectEvidence(replay, event.evidenceId);
    else {
      if (index === actionIndex)
        return {
          before: replay,
          originalAfter: applyAction(replay, event.actionId),
          originalAction: JSON.parse(JSON.stringify(event)),
          availableActions: getAvailableActions(replay),
        };
      replay = applyAction(replay, event.actionId);
      index++;
    }
  }
  throw new Error("That action checkpoint is outside this incident history.");
}

/** One-step counterfactual: both outcomes start at the same budget and evidence. */
export function previewAlternative(source, actionIndex, alternativeId) {
  const checkpoint = replayCheckpoint(source, actionIndex);
  const action = checkpoint.availableActions.find(
    (candidate) => candidate.id === alternativeId,
  );
  if (!action?.available)
    throw new Error(
      action?.reason || "Choose an intervention available at this checkpoint.",
    );
  const alternativeAfter = applyAction(checkpoint.before, alternativeId);
  const metricsDelta = Object.fromEntries(
    Object.keys(checkpoint.before.metrics).map((key) => [
      key,
      Math.round(
        (alternativeAfter.metrics[key] -
          checkpoint.originalAfter.metrics[key]) *
          100,
      ) / 100,
    ]),
  );
  return {
    ...checkpoint,
    alternativeAction: {
      id: action.id,
      label: action.label,
      cost: action.cost,
    },
    alternativeAfter,
    metricsDelta,
    budgetDelta:
      alternativeAfter.budgetRemaining -
      checkpoint.originalAfter.budgetRemaining,
    disclosure:
      "One deterministic simulated step, including the environment advance. This is not a prediction for a live system or a comparison of final recovery outcomes.",
  };
}
