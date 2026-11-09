# Deadlock Manor demo script

Target runtime: **2 minutes 40 seconds**. Record the working application and upload the final video publicly to **YouTube**. The [Kiroween 2026 rules](https://kiroween.devpost.com/rules) require a demonstration shorter than three minutes; judges need not watch beyond that point.

This is a recording plan, not a claim that a video has been produced. Check every action against the final build before recording. Do not show a prepared result in place of a working interaction.

No suitable Deadlock Manor gameplay screenshot or recording was found in the reviewed submission-artifact filename inventory on 2026-11-09. Account, credit-request and draft-form screenshots are not game footage. Capture the real running application when browser recording becomes available; do not substitute rendered game-interface images.

## Concrete route to rehearse

Use **The Phantom Release**. Open **Deployment ledger** and **A checkout's last words**. Choose **Pause the rollout**, **Roll back v2.7**, then **Run a synthetic checkout**. A direct call to the unchanged engine on November 9 reproduced resolution with three capacity remaining (score 90 for exactly these two clues and three actions); this is engine verification, not new UI footage.

For replay, choose the first recorded decision and **Add application capacity**, then **Compare one step**. The source comparison begins with the same two clues and seven capacity. Optionally **Continue this alternative**, confirm the branch and **Return to original shift**. Keep this a one-step comparison; do not present it as an optimal full recovery path.

## Before recording

- Open the application at its final public URL and confirm that it loads in a clean browser session.
- Choose a scenario and rehearse one complete recovery path using the app's evidence and action controls.
- Keep private credentials, account details, unrelated tabs, and notifications outside the recording.
- Use original narration. Avoid unlicensed music, third-party trademarks, and copyrighted media.
- Include English narration or English subtitles and leave enough time for viewers to read the evidence.
- Use the precise [Kiro review record](kiro-usage.md) when explaining its contribution. Keep the distinction between Kiro's suggestions and Codex's implementation and verification.

## 0:00–0:20 — Introduce the problem

Show the application title and the active scenario.

Suggested narration: “Deadlock Manor turns incident response into a haunted investigation. You examine a failing system, read the evidence, and choose a recovery plan while your action budget runs down. It is designed for people practicing the reasoning behind operational decisions.”

## 0:20–0:50 — Read evidence

Open the scenario's evidence and show how it supports a diagnosis. Explain one concrete observation visible on screen rather than reading every line.

Suggested narration: “The deployment ledger shows a schema rename. The trace ties decoder failures to the new version. These clues point to a broken contract rather than a capacity shortage.”

## 0:50–1:35 — Demonstrate a decision and its consequence

Execute **Pause the rollout → Roll back v2.7 → Run a synthetic checkout** one action at a time. Keep the changed state, remaining budget, and relevant feedback visible. Explain why each action follows from the evidence. If showing a mistaken action, describe its real consequence; do not imply that every action improves the outcome.

Suggested narration: “An action changes the simulated incident and consumes part of the budget. I can see the consequence, reconsider the evidence, and choose what to do next.”

## 1:35–1:55 — Show the outcome

Display the terminal result, then use the first replay checkpoint to compare **Add application capacity** against **Pause the rollout**. Show that the comparison retains the checkpoint's original evidence and budget. Explain the actual recorded result; keep the one-step scope visible. If the run fails, show the failure honestly and use a separate new run for a successful recovery.

## 1:55–2:20 — Explain implementation and Kiro use

Show the public repository and the relevant implementation or test alongside the `.kiro` materials.

Suggested factual narration: “Kiro's authenticated CLI reviewed replay persistence read-only. Codex reproduced two warning issues, implemented fixes and wrote regression tests. One speculative finding was rejected. Codex independently repaired backup deletion order. The original game and planning files were Codex-assisted.” Show the sanitized prompt, response assessment and relevant diff; do not show account details. Kiro did not write the original app or run these tests. This remains a script, not evidence that this video segment has been recorded.

## 2:20–2:40 — Close with the project links

Show the working application URL and public GitHub repository. Summarize the demonstrated learning goal in one sentence. Keep the final frame visible long enough to read and stop before three minutes.

## Publication checks

Verify that the YouTube video is public, the audio and text are understandable, the application works at the linked URL, and the repository instructions reproduce the demonstrated behavior. Add the real video URL to the Devpost entry only after publishing it.
