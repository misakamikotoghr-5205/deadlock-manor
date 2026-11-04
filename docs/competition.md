# Kiroween 2026 preparation

Deadlock Manor is being prepared as a **Costume Contest** project: a haunted incident-response simulator whose visual atmosphere supports the task of examining evidence and deciding how to recover a failing system.

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

The current implementation work is being performed by Codex agents. **Actual Kiro development or review has not yet been completed.** Kiro CLI 3.0.0 was downloaded from the official distribution and its SHA256 checksum verified. Both `whoami` and a real non-interactive review attempt returned a missing-authentication error on November 4, 2026:

```text
Not logged in. Set the KIRO_API_KEY environment variable or run `kiro-cli login` first.
```

Kiro authentication is currently missing. A user must complete the supported login flow or securely configure `KIRO_API_KEY` before the project can receive a genuine Kiro implementation or review contribution. Do not claim that Kiro generated, reviewed, or tested any code until that work has actually happened and been documented. See the official [authentication](https://kiro.dev/docs/cli/authentication/) and [headless mode](https://kiro.dev/docs/cli/headless/) documentation.

The repository's `.kiro` files are preparation material. They are not a substitute for the required use of Kiro. The official rules allow disqualification for insufficient use of Kiro.

## Remaining entry work

- Authenticate Kiro, use it substantively on the project, and preserve an accurate record of its contribution.
- Publish and verify a working application URL.
- Record and publish the final demonstration on YouTube.
- Register and complete the Devpost entry, including the repository URL, application URL, video URL, and truthful Kiro write-up.

Publishing source code to GitHub is a separate step from entering the competition. This document does not claim that the project has been formally submitted or accepted.

## Distinguishing other Kiro promotions

The older [Code with Kiro Hackathon](https://kiro.devpost.com/) ended in 2025. The Chinese [Kiro million-yuan prize-pool promotion](https://aws.amazon.com/cn/about-aws/events/events/dont-code-alone-win-with-kiro/) links [terms](https://d1.awsstatic.com/onedam/marketing-channels/website/aws/zh_CN/about-aws/pdf/events/promotional-offer-terms-and%20conditions-kiro.pdf) ending March 1, 2026. Neither is presented here as an open event or an additional prize available for this project.
