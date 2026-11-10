# Kiroween 2026 submission

Deadlock Manor was submitted on November 10, 2026 as a **Costume Contest** project: a haunted incident-response simulator whose visual atmosphere supports the task of examining evidence and deciding how to recover a failing system.

## Official event and dates

- Event: [Kiroween 2026](https://kiroween.devpost.com/), sponsored by Amazon Web Services and administered by Devpost.
- Governing source: [Official Rules](https://kiroween.devpost.com/rules).
- Project-building and submission window: October 30, 2026 at 09:00 Pacific Time through December 4, 2026 at 14:00 Pacific Time.
- Submission deadline: **December 4, 2026 at 22:00 UTC**, or December 5, 2026 at 06:00 Beijing time. The deadline falls in Pacific Standard Time.
- Only new projects created during that window are eligible. Teams may have up to three people.

These requirements were checked against the official pages on November 4, 2026. The official rules remain authoritative.

## Submission materials

Prepare all of the following before entering the project on Devpost:

1. A public GitHub repository containing the complete source code, assets, an open-source license, and instructions needed to run the project. GitLab and Bitbucket are not accepted for this event.
2. A root `.kiro` directory showing actual Kiro usage, such as specs, hooks, and steering. Do not ignore it in Git. Configuration files alone do not establish that development happened in Kiro.
3. A URL where judges can use the working application. Put any necessary private testing credentials in the judge-only submission field.
4. A description of the project's functionality and the chosen **Costume Contest** category.
5. A public **YouTube** demonstration video shorter than three minutes, showing the application working on its intended device. See [the recording script](demo-script.md).
6. An accurate explanation of how Kiro was used. Submission materials must be in English or include English translations.

## Honest development status

The original implementation and `.kiro` preparation files were written by Codex agents. On November 9, 2026, an authenticated official Kiro CLI 3.0.0 session completed a **real read-only review**, lasting 92.614 seconds with exit code zero. Only `fs_read` was trusted; Kiro did not edit files, execute tests or use shell tools. Codex independently reproduced two warning issues from Kiro's suggestions and implemented the fixes and regressions. A speculative aliasing finding was rejected, and a related save-before-backup-delete repair was independently found and implemented by Codex. See the [record and assessment](kiro-usage.md), including the actual prompt and response.

Earlier failed authentication attempts remain historical evidence, not the current result. This one completed review must not be described as Kiro writing the original application, validating all behavior, or executing its tests. The `.kiro` files remain Codex preparation material. The organizer determines whether the demonstrated Kiro use satisfies its rules; this record does not claim that decision.

## Confirmed entry and remaining distinctions

- Review the actual Kiro contribution record and represent its scope accurately in the final entry.
- After the participant's action-time rules consent, final Submit succeeded on November 10. The [official project page](https://devpost.com/software/deadlock-manor) displayed “Project submitted!” and “Submitted to Kiroween 2026”. The submitted source revision is 3227460b00c98701b813c6c82ea09a82e8f7281c.
- The [146.8-second walkthrough](https://youtu.be/L3BpOsPHobo) was publicly published on YouTube on November 10. It is an edit of actual browser screenshots, not continuous recording; publication does not establish independent anonymous player playback.
- The [sanitized submission record](local-demo-20261109.json) records the official entry receipt. Kiro credit review and Didit verification remain a separate process; no credit grant is confirmed.

Publishing source code to GitHub is a separate step from entering the competition. The project entry is confirmed as submitted; organizer eligibility approval and judging results are not claimed.

## Distinguishing other Kiro promotions

The older [Code with Kiro Hackathon](https://kiro.devpost.com/) ended in 2025. The Chinese [Kiro million-yuan prize-pool promotion](https://aws.amazon.com/cn/about-aws/events/events/dont-code-alone-win-with-kiro/) links [terms](https://d1.awsstatic.com/onedam/marketing-channels/website/aws/zh_CN/about-aws/pdf/events/promotional-offer-terms-and%20conditions-kiro.pdf) ending March 1, 2026. Neither is presented here as an open event or an additional prize available for this project.
