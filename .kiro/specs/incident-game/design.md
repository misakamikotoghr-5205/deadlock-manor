# Design

Content and simulation remain independent from the view so causal behavior can
be verified without a browser. A serializable game state stores the scenario,
metrics, action/evidence history, remaining budget, and terminal outcome.

The UI presents the incident briefing, a haunted service map, four operational
metrics, inspectable evidence, three rule-based advisers, and mitigation controls.
Actions produce visible feedback and an append-only timeline. A finished game
offers a review and export. Browser storage holds only this fictional game state.

Build copies an explicit allowlist into dist/. The development server also serves
an explicit file allowlist, so documentation and local tool credentials stay private.

Verification covers winning and losing routes, action-budget integrity, invalid
actions, repeated evidence, state immutability, and accurate postmortem history.
