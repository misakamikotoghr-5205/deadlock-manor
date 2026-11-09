# Actual Kiro usage status

## Completed authenticated review — 2026-11-09 UTC

The official Kiro CLI 3.0.0 completed one noninteractive, read-only review from
06:21:59.970509 to 06:23:32.550382 UTC: **92.614 seconds, exit code 0**. The invocation
trusted only `fs_read`, with no shell/write tools, workspace-trust override or
trust-all setting. It used the existing authenticated Free setup; no upgrade,
payment or overage activation was performed. Actual credit consumption was not
measured. One CLI session can contain multiple internal model/tool turns; no
claim of exactly one underlying API request is made.

Kiro reviewed the public app/replay/simulation source and existing tests. It
suggested fixes for overwritten branch-save failure warnings and silently
ignored original-backup read failures. Codex reproduced those issues against
the actual application handlers with injected storage failures and implemented
adapted minimal fixes. Kiro's claimed aliasing bug was rejected as speculative,
and its blanket data-loss description was narrowed to what the tests show.
Codex independently found and repaired deletion of the original backup before
a failed replacement save; that finding is **not attributed to Kiro**.

Kiro made no code edits and ran no tests. Codex wrote six persistence regressions;
all **27 Node tests**, syntax/document checks and the static build passed. The
regressions use the actual app source with rendering sinks in a Node VM, not a
full browser. No new manual browser verification or final contest submission is
claimed. The original app and `.kiro` planning material remain Codex-authored.

Evidence: [metadata](evidence/kiro-review-20261109.json),
[actual prompt](evidence/kiro-review-20261109-prompt.txt),
[actual sanitized response](evidence/kiro-review-20261109-response.txt),
[tool-read trace](evidence/kiro-review-20261109-stderr.txt), and
[accepted/rejected findings and reproduction notes](evidence/kiro-review-20261109-assessment.md).

## Historical unauthenticated attempt — 2026-11-04 UTC

Checked 2026-11-04 UTC. The task-local Kiro CLI 3.0.0 Linux binary was downloaded
from Kiro's official distribution and its manifest SHA256 was verified.

`kiro-cli --version` and help succeeded. `kiro-cli whoami` returned exit code 1:
`Not logged in`. A noninteractive `chat --v3 --no-interactive --trust-tools=`
review attempt also returned exit code 1 because neither an authenticated session
nor `KIRO_API_KEY` was available. No login was initiated and no credentials were
read, changed or committed.

At that time no Kiro implementation or review contribution was claimed. The
source and `.kiro` artifacts were written by Codex agents. This failed attempt is
preserved separately from the completed November 9 review above.

Official references: [authentication](https://kiro.dev/docs/cli/authentication/),
[headless use](https://kiro.dev/docs/cli/headless/),
[contest rules](https://kiroween.devpost.com/rules).

## Authentication recheck — 2026-11-07 UTC

The installed official `kiro-cli 3.0.0` was checked again with `whoami`, with an
eight-second limit and no interactive input. It returned exit code 1 in 1.214
seconds and reported that the CLI was not logged in. `KIRO_API_KEY` was not
configured. Raw account output and credential values were not retained.

No login, authorization, model request, implementation or review was performed
in this recheck. At that time, the project had no genuine Kiro contribution. Browser
login to a different service is not a Kiro CLI session; the supported Kiro sign-in
must be completed separately. The current official documentation requires a paid
Kiro plan for API-key creation, so obtaining a new API key is not presented as a
free workaround. See the [current authentication documentation](https://kiro.dev/docs/getting-started/authentication/)
and the [sanitized check record](evidence/authentication-20261107.json).
