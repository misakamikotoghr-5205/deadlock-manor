# Deadlock Manor — ready-to-paste Devpost copy

Updated 2026-11-10. This is entry material, not a submission receipt. The latest Markdown Story was saved in the existing draft. Additional Info was saved with Save & continue, and revisiting it verified persistence of the repository and public game URLs, testing instructions, Kiro-use explanation and reuse disclosure. Category and participation selections were also saved. The draft still displays 2/5 steps; no final submission is claimed.

## Project fields

- **Project name:** Deadlock Manor
- **Tagline:** Trace the evidence. Break the curse. Restore the system.
- **Category:** Costume Contest
- **Built with:** JavaScript, HTML, CSS, Node.js; Codex coding assistance and an authenticated Kiro CLI development review.
- **Public source:** https://github.com/misakamikotoghr-5205/deadlock-manor
- **Judge-accessible application URL:** https://misakamikotoghr-5205.github.io/deadlock-manor/ — anonymous HTTP access to the page and all runtime assets was verified, and the actual browser route below was exercised at this public URL. The separate owner-only Sites preview is not used as the judge link.
- **Public YouTube URL:** publication pending. A 146.8-second edited walkthrough using actual November 9 browser screenshots, English narration and subtitles is complete locally; it is explicitly labelled as screenshot editing, not continuous recording. No video URL is invented here.

## Story — paste the following sections

### Inspiration

An incident dashboard tells you that something is wrong. Learning to respond means deciding which evidence matters, choosing an intervention and checking whether it actually helped. Deadlock Manor turns that reasoning into a haunted investigation: the failing system is the mystery, and recovery is the way out.

### What it does

Players enter one of three fictional outages: a broken release in **The Phantom Release**, abandoned database connections in **The Connection Crypt**, or a retry feedback loop in **The Echoing Ballroom**. They inspect logs, traces and runbooks, then spend limited response capacity on interventions. Actions have causal effects and side effects. Improving a graph is not enough: the player must repair the underlying problem and complete the scenario's simulated recovery check.

The **Causal Replay Lab** revisits a recorded decision with exactly the evidence, capacity and state available at that moment. It compares one alternative step, supports deliberately continuing that branch, and preserves a return path to the original shift. A downloadable case report records the decisions, outcome and score. The haunted casebook, evidence cards and midnight-outage setting are our Costume Contest treatment of a familiar incident-response drill.

### How it was built

The application uses native browser modules with HTML and CSS, and a pure JavaScript simulation engine. Immutable transitions make saved histories replayable. The Analyst, Skeptic and Commander use transparent deterministic rules; the running game needs no model or external service. Node's built-in test runner checks the scenarios, replay integrity and persistence fault handling. The project contains 27 passing local tests, a static build and MIT-licensed source.

The original game, content and `.kiro` planning material were created with coordinated Codex assistance. On November 9, the authenticated official **Kiro CLI 3.0.0** completed a **92.614-second read-only review**, trusting only `fs_read`. It identified overwritten branch-save warnings and silently ignored backup-read failures. Codex reproduced both warning issues against the actual application handlers, adapted the fixes and added regressions. One speculative aliasing finding was rejected. Codex also independently found and fixed premature backup deletion during a failed restoration save. **Kiro did not write the original application, edit these fixes or run the tests.** The exact prompt, response, trace and assessment are published in the repository.

### Challenges and lessons

Replay must retain what was known at the decision point instead of borrowing clues discovered later. Persistence also needs precise promises: a failed save must stay visible, and an existing original backup must survive until its replacement is saved. The review was useful because its suggestions were reproduced and assessed individually, rather than accepted as proof.

### What's next

The next steps are publishing the completed edited gameplay walkthrough, completing the final contest form and collecting feedback on how clearly players can explain their interventions. Further scenarios should preserve the same evidence trail and explicit distinction between containment, repair and verification.

## Reviewer run instructions

Node.js 22 or newer; no dependency installation or account setup is required:

```sh
git clone https://github.com/misakamikotoghr-5205/deadlock-manor.git
cd deadlock-manor
npm run dev
```

Open `http://127.0.0.1:4173`. Choose **The Phantom Release**, read **Deployment ledger** and **A checkout's last words**, then choose **Pause the rollout**, **Roll back v2.7**, and **Run a synthetic checkout**. The engine reproduces a resolved shift with three capacity remaining for this route. The displayed score depends on the evidence/actions actually taken.

After resolution, open **Causal Replay Lab**, choose the first decision, select **Add application capacity**, and use **Compare one step**. The comparison describes one deterministic simulated step. Use **Continue this alternative** only when deliberately branching, then **Return to original shift** to restore the original. This route, the confirmed branch and the return were exercised in the actual November 9 browser session. The local video uses edited screenshots from that session, not continuous recording; see the [demo record](local-demo-20261109.json).

```sh
npm test
npm run check
npm run build
```

`dist/` is a portable static site; serve it over HTTP so browser modules load. Browser saving is best effort; download the case report when saving is unavailable.

## Evidence and disclosure links

- [Actual Kiro usage and authorship](https://github.com/misakamikotoghr-5205/deadlock-manor/blob/83ab65a92bcfdaebb04589cd7a8fa1a272ada2b3/docs/kiro-usage.md)
- [Review metadata](https://github.com/misakamikotoghr-5205/deadlock-manor/blob/83ab65a92bcfdaebb04589cd7a8fa1a272ada2b3/docs/evidence/kiro-review-20261109.json)
- [Accepted/rejected findings and independent Codex repair](https://github.com/misakamikotoghr-5205/deadlock-manor/blob/83ab65a92bcfdaebb04589cd7a8fa1a272ada2b3/docs/evidence/kiro-review-20261109-assessment.md)
- [Existing-product comparison and reuse statement](landscape.md)
- [Actual edited walkthrough and narration](demo-script.md)
- [Local video provenance and validation](local-demo-20261109.json)
- [Official rules](https://kiroween.devpost.com/rules)

The incidents and assets are original and fictional. Existing incident simulators informed the comparison, with no copied third-party implementation or assets claimed. No student, startup, prior-year or other bonus eligibility is asserted. The organizer determines whether this bounded Kiro contribution satisfies its use requirement.

## Still needed in the live form

The latest Story and the completed Additional Info fields have been saved and reloaded successfully. Four participant-only questions remain unanswered: 2025 registration, AWS employment, how much Kiro helped with learning new skills, and willingness to use Kiro again. Publish the completed 146.8-second edited functional walkthrough on YouTube, supply its URL and complete the final contest entry after the participant answers those questions. The video has not been uploaded and no public video URL or final-entry receipt is available. The credit application is a separate submitted request pending review/Didit verification, with no confirmed grant. None of those stages is upgraded by saving a draft.
