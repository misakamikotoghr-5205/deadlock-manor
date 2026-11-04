# Deadlock Manor demo script

Target runtime: **2 minutes 40 seconds**. Record the working application and upload the final video publicly to **YouTube**. The [Kiroween 2026 rules](https://kiroween.devpost.com/rules) require a demonstration shorter than three minutes; judges need not watch beyond that point.

This is a recording plan, not a claim that a video has been produced. Check every action against the final build before recording. Do not show a prepared result in place of a working interaction.

## Before recording

- Open the application at its final public URL and confirm that it loads in a clean browser session.
- Choose a scenario and rehearse one complete recovery path using the app's evidence and action controls.
- Keep private credentials, account details, unrelated tabs, and notifications outside the recording.
- Use original narration. Avoid unlicensed music, third-party trademarks, and copyrighted media.
- Include English narration or English subtitles and leave enough time for viewers to read the evidence.
- Resolve the Kiro authentication gap described in [competition.md](competition.md) before preparing a claim of Kiro use. Record only work Kiro actually performed.

## 0:00–0:20 — Introduce the problem

Show the application title and the active scenario.

Suggested narration: “Deadlock Manor turns incident response into a haunted investigation. You examine a failing system, read the evidence, and choose a recovery plan while your action budget runs down. It is designed for people practicing the reasoning behind operational decisions.”

## 0:20–0:50 — Read evidence

Open the scenario's evidence and show how it supports a diagnosis. Explain one concrete observation visible on screen rather than reading every line.

Suggested narration: “The atmosphere creates the mystery, but the decisions come from the evidence. Here is the signal that tells us what to investigate before spending an action.”

## 0:50–1:35 — Demonstrate a decision and its consequence

Execute the rehearsed recovery sequence one action at a time. Keep the changed state, remaining budget, and relevant feedback visible. Explain why each action follows from the evidence. If showing a mistaken action, describe its real consequence; do not imply that every action improves the outcome.

Suggested narration: “An action changes the simulated incident and consumes part of the budget. I can see the consequence, reconsider the evidence, and choose what to do next.”

## 1:35–1:55 — Show the outcome

Display the terminal result and report. Explain the actual result reached in this recording and point to the evidence that supports it. If the run fails, show the failure honestly and use a separate new run for a successful recovery.

## 1:55–2:20 — Explain implementation and Kiro use

Show the public repository and the relevant implementation or test alongside the `.kiro` materials.

**Current status:** Kiro CLI is installed, but authentication is missing and no successful Kiro contribution has been recorded. Do not narrate a completed Kiro contribution while that remains true.

After real Kiro work is completed, replace this paragraph with a specific statement supported by the saved session: which Kiro surface was used, what it implemented or reviewed, what feedback mattered, and how the result was checked. Avoid attributing Codex-agent work to Kiro.

## 2:20–2:40 — Close with the project links

Show the working application URL and public GitHub repository. Summarize the demonstrated learning goal in one sentence. Keep the final frame visible long enough to read and stop before three minutes.

## Publication checks

Verify that the YouTube video is public, the audio and text are understandable, the application works at the linked URL, and the repository instructions reproduce the demonstrated behavior. Add the real video URL to the Devpost entry only after publishing it.
