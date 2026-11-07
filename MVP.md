# mvp-tracker MVP

## AWS path
Due: 2026-11-10
Done when:
- EC2 reads the tracked repo's files from GitHub, using a short-lived installation token from the GitHub App.
- EC2 saves a row in RDS.
- RDS is in a private subnet and accepts connections only from EC2.
- The GitHub App's private key is never committed, and EC2 loads it from AWS Secrets Manager.
- `docs/setup.md` records the GitHub App's settings (read-only Contents access, one repo, webhooks off), how access to RDS is limited to EC2, and the AWS billing alerts.

## Comparison
Due: 2026-11-14
Done when:
- `MVP.md` is parsed into deliverables with deadlines and done criteria, and a missing deadline, missing criteria, or malformed file is reported as a problem.
- EC2 reads `MVP.md` and the code, and asks an LLM for a verdict on every done criterion: met, or not met with tasks.
- A response that skips a criterion, names an unknown criterion or deliverable, or marks a criterion not met with no tasks counts as a failed comparison.
- Secret files are never sent to the LLM.
- Pressing Compare returns immediately while the comparison runs in the background.
- EC2 saves the plan and results together, and a failed comparison leaves earlier results in place.
- Pressing the button during a run doesn't start a second run, and a run left unfinished by a timeout or restart counts as failed.

## Timeline page
Due: 2026-11-21
Done when:
- The repo contains what's needed to deploy the React app to S3 behind CloudFront, with `/api/*` routed to EC2.
- The page is served on my domain over HTTPS, and EC2 accepts API traffic only from CloudFront.
- The page shows each deliverable on its deadline and marks today.
- Done deliverables take one line and look different in shape and color. Open deliverables show their done criteria, tasks left, and days left.
- Every reload refreshes the plan from `MVP.md`, and deliverables appear before the first comparison.
- The page shows a message when `MVP.md` is missing or invalid, keeping the last valid plan when there is one, and shows the saved plan with a notice when GitHub can't be reached.
- The page shows when the last comparison ran, when one is running, when one failed, and when `MVP.md` has changed since the last one.
- The page uses GitHub's light and dark colors, follows the device's setting, and works at phone width.

## GitHub sign-in
Due: 2026-11-27
Done when:
- The page requires signing in through the GitHub App.
- Only my numeric GitHub user ID is allowed in, and a test shows any other account is refused.
- Running a comparison and refreshing the plan both require a signed-in session.

## One real project
Due: 2026-11-28
Done when:
- `docs/first-run.md` records a real project's comparison, whether its tasks were accurate, and anything fixed as a result.
