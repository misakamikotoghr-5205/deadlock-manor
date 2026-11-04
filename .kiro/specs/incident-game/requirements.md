# Incident game requirements

1. WHEN a player selects an incident, THE SYSTEM SHALL initialize a fresh game
   with a bounded action budget, incident metrics, evidence, and available actions.
2. WHEN the player inspects evidence, THE SYSTEM SHALL record the inspection
   without spending the mitigation budget.
3. WHEN the player applies an action, THE SYSTEM SHALL validate availability,
   advance the simulation, and expose causal changes and role-based feedback.
4. WHEN mitigation succeeds or the action budget expires, THE SYSTEM SHALL
   prevent further mutations and provide a score with explanatory findings.
5. WHEN the browser reloads, THE SYSTEM SHALL restore a valid saved game or
   safely recover from a corrupt/incompatible saved game.
6. WHEN the player exports a postmortem, THE SYSTEM SHALL download a readable
   report derived from the actual game history.
7. THE SYSTEM SHALL support keyboard navigation, narrow screens, reduced motion,
   and understandable text labels for every action.
8. THE SYSTEM SHALL clearly identify the fictional incidents and rule-based
   advisers, and SHALL NOT present them as live production monitoring or LLM agents.
