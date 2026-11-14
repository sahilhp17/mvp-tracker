# mvp-tracker

> A deliverable is done when every bullet under it is true.

## 2026-11-10 · AWS path

- EC2 reads the tracked repo's files from GitHub, using a short-lived installation token from the GitHub App.
- EC2 saves a row in RDS.
- RDS is in a private subnet and accepts connections only from EC2.
- The GitHub App's private key is never committed.
- EC2 loads the GitHub App's private key from AWS Secrets Manager.
- `docs/setup.md` records the GitHub App's settings: read-only Contents access, one repo, webhooks off.
- `docs/setup.md` records how access to RDS is limited to EC2.
- `docs/setup.md` records the AWS billing alerts.

## 2026-11-14 · Comparison

- An LLM on Bedrock extracts deliverables, deadlines and done criteria from `MVP.md`, copying each criterion word for word.
- Each version of `MVP.md` is extracted once, and an unchanged file isn't sent to the LLM again.
- A criterion moved to another deliverable keeps its key, and only bottom-level bullets are judged.
- A missing deadline, missing criteria, or malformed `MVP.md` is reported as a problem.
- EC2 reads `MVP.md` and the code.
- EC2 asks an LLM for a verdict on every done criterion: met, or not met with tasks.
- A response that skips a criterion counts as a failed comparison.
- A response that names an unknown criterion or deliverable counts as a failed comparison.
- A response that marks a criterion not met with no tasks counts as a failed comparison.
- Secret files are never sent to the LLM.
- Pressing Compare returns immediately while the comparison runs in the background.
- Each comparison records which version of `MVP.md` it used.
- A failed comparison leaves earlier results in place.
- Pressing Compare during a run doesn't start a second run.
- A run left unfinished by a timeout or restart counts as failed.

## 2026-11-21 · Timeline page

- The repo contains what's needed to deploy the React app to S3 behind CloudFront.
- CloudFront routes `/api/*` to EC2.
- The page is served on my domain over HTTPS.
- EC2 accepts API traffic only from CloudFront.
- The page shows each deliverable on its deadline and marks today.
- Done deliverables take one line and look different in shape and color.
- Open deliverables show their done criteria, tasks left, and days left.
- Every reload refreshes the MVP from `MVP.md`.
- Deliverables appear before the first comparison.
- The page shows a message when `MVP.md` is missing or invalid, keeping the last valid MVP when there is one.
- The page shows the saved MVP with a notice when GitHub can't be reached.
- The page shows when the last comparison ran, when one is running, and when one failed.
- The page shows when `MVP.md` has changed since the last comparison.
- The page uses GitHub's light and dark colors and follows the device's setting.
- The page works at phone width.

## 2026-11-27 · GitHub sign-in

- The page requires signing in through the GitHub App.
- Only my numeric GitHub user ID is allowed in.
- A test shows any other account is refused.
- Running a comparison requires a signed-in session.
- Refreshing the MVP requires a signed-in session.

## 2026-11-28 · One real project

- `docs/first-run.md` records a real project's comparison.
- `docs/first-run.md` records whether the comparison's tasks were accurate.
- `docs/first-run.md` records anything fixed as a result.

<!--
Recommended style for this file. mvp-tracker's LLM reads it and works out the deliverables,
deadlines and done criteria itself, so other layouts work too; this style keeps it reliable.
- One "## YYYY-MM-DD · Title" heading per deliverable, in date order.
- A "-" bullet list under each heading: one checkable done criterion per bullet.
- "> " blockquotes are notes for people.
-->
