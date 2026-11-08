# mvp-tracker spec

A page that compares `MVP.md` with your code and shows the tasks left on a timeline, built to learn EC2, RDS, S3 and CloudFront.

## Problem Statement

I start projects without set deadlines, done criteria, or an attainable MVP. Stride, for example, had task tracking but no MVP, and I burned out on endless UX improvements because nothing defined "good enough". GitHub's milestones and roadmap can hold dates, but they only know what I type into them, so they can't tell me what my code still lacks.

I also want to learn AWS by building something real. I can't yet run a server on EC2, store data in RDS, or host a site on S3 and CloudFront.

## Solution

I write an `MVP.md` in a repo, listing deliverables with a deadline and done criteria for each. I sign in with GitHub and open a page showing those deliverables on a timeline. The page refreshes the MVP from `MVP.md` on every reload, before any comparison has run. When I press "Compare with code", an LLM compares `MVP.md` with the repo's code and lists the tasks left, grouped by deliverable and tied to done criteria. Results are saved, so they're still there when I come back.

The React frontend is served from S3 through CloudFront, the API runs on EC2, and data is stored in RDS. Learning these services is the main reason for building it, so a cheaper stack isn't the goal.

## User Stories

**Setting up**

1. As the user, I want to write `MVP.md` by hand in my repo, so that the plan lives beside the code and I own it.
2. As the user, I want `MVP.md` to list deliverables, so that the project is broken into parts I can finish.
3. As the user, I want each deliverable to have a deadline, so that it appears on the timeline.
4. As the user, I want each deliverable to have done criteria, so that "good enough" is defined before I start polishing.
5. As the user, I want a repo to count as trackable when `MVP.md` is at its root, so that no extra configuration is needed.
6. As the user, I want a clear message when the repo has no `MVP.md`, so that I know what to add.
7. As the user, I want a clear message when `MVP.md` is missing a deadline or done criteria, so that I can fix the file.

**Signing in and repo access**

8. As the user, I want to sign in with GitHub, so that I can learn and show working authentication.
9. As the user, I want only my account to be allowed in, so that a hosted page doesn't expose my project to anyone else.
10. As the user, I want the app to access only the one repo I chose, so that my other repos aren't read.
11. As the user, I want the app to only read from GitHub, so that it can never change my repo.
12. As the user, I want to choose which repo is tracked by installing the GitHub App on it, so that I can point it at a real project without a repo picker in the app.

**Comparing with code**

13. As the user, I want to press a button to run the comparison, so that I only pay for LLM calls I choose to make.
14. As the user, I want the comparison to read `MVP.md` and the repo's code, so that its results reflect what the code actually does.
15. As the user, I want each task left to be one specific thing the code doesn't do yet, so that I can act on it.
16. As the user, I want every task tied to a deliverable's done criteria, so that the tool can't invent extra work.
17. As the user, I want tasks grouped by deliverable, so that I can see what each one needs.
18. As the user, I want a deliverable marked done when nothing is left against its criteria, so that I don't have to judge my own work every time.
19. As the user, I want to see when the comparison last ran, so that I know how current the results are.
20. As the user, I want to see that a comparison is running, so that I don't press the button again.
21. As the user, I want a clear message when a comparison fails, so that I know to try again and my earlier results stay in place.
22. As the user, I want results saved, so that they survive a refresh or a new session.
23. As the user, I want a new comparison to replace the old results, so that I only see the current list.

**The timeline page**

24. As the user, I want to see each deliverable on its deadline, so that I can see the project at a glance.
25. As the user, I want to see where today falls, so that I can tell whether I'm ahead or behind.
26. As the user, I want finished and open deliverables to look different, in shape as well as color, so that I can read status quickly.
27. As the user, I want finished deliverables reduced to one line, so that attention goes to what's left.
28. As the user, I want open deliverables to show their done criteria and tasks left, so that I can pick up work easily.
29. As the user, I want the days left shown for open deliverables, so that deadlines feel concrete.
30. As the user, I want the page to work on a phone-sized screen, so that I can check it away from my desk.

**Learning AWS**

31. As the user, I want to serve the React frontend from S3 through CloudFront, so that I learn the standard way to host a static site on AWS.
32. As the user, I want to run the API on EC2, so that I learn how to run a server on AWS.
33. As the user, I want to store repo data and results in RDS, so that I learn how to run a database on AWS.
34. As the user, I want billing alerts in place from the start, so that a mistake doesn't turn into a surprise bill.

**Keeping the MVP current**

35. As the user, I want the page to refresh the MVP from `MVP.md` on every reload, so that the timeline matches the file without an LLM call.
36. As the user, I want to see my deliverables before the first comparison, so that the timeline is useful right away.
37. As the user, I want to see the saved MVP and a notice when GitHub can't be reached, so that a GitHub outage doesn't blank the page.
38. As the user, I want to keep seeing my last valid MVP when `MVP.md` becomes invalid, so that a typo doesn't hide my project.
39. As the user, I want a notice when `MVP.md` has changed since the last comparison, so that I know the tasks may be out of date.

**Theme**

40. As the user, I want the page to use GitHub's light and dark colors and follow my device's setting, so that it feels at home beside my repos.

## Implementation Decisions

**Architecture**

```
Browser ──HTTPS──▶ CloudFront (your domain, free HTTPS certificate)
                     ├─ /*      ──▶ S3 (built React files, private bucket)
                     └─ /api/*  ──▶ EC2 (Fastify API)

┌──────────────────────── VPC ─────────────────────────────┐
│  Public subnet:   EC2 ──▶ internet gateway ──▶ GitHub, LLM │
│                    │                                       │
│  Private subnet:  RDS ◀── only EC2 can connect             │
└───────────────────────────────────────────────────────────┘
```

- **CloudFront:** serves the site on my domain over HTTPS. It sends `/api/*` to EC2 and everything else to S3, so the page and API share one domain and sign-in cookies work without cross-origin setup. It never caches `/api/*`, and gives `index.html` a short cache time so new deployments show straight away.
- **S3:** a private bucket holding the built React app, readable only through CloudFront.
- **EC2:** runs the Fastify API in a public subnet. It reaches GitHub and the LLM through the VPC's internet gateway, so no NAT gateway is needed. Its security group accepts API traffic only from CloudFront, using AWS's managed CloudFront prefix list. It holds the GitHub App's private key, handles sign-in, reads `MVP.md` on reload, runs comparisons, and is the only thing that talks to RDS.
- **RDS:** Postgres in a private subnet of the same VPC. Its security group accepts connections only from EC2's security group.
- **Secrets:** the GitHub App's private key and the LLM API key are stored in AWS Secrets Manager, and EC2 reads them through its IAM role. They're never committed.

**Stack**

- TypeScript throughout, run with Bun.
- **Frontend:** React, built with Vite. No full stack framework.
- **API:** Fastify on EC2.
- **Database:** `pg` with plain SQL and no ORM. PGLite stands in for Postgres in tests.
- **GitHub:** `@octokit/auth-app` creates installation tokens, and the API is called with `fetch`.

**Modules**

These are sketches of each module's interface.

```ts
// MVP reader
parseMvp(content): Mvp | { problems: Problem[] }

// GitHub access
interface RepoSource {
  readMvpFile(): Promise<string | null>   // null if there's no MVP.md
  read(): Promise<RepoFile[]>
}

// Comparison
interface Llm { complete(prompt: string): Promise<string> }
assess(mvp, files, llm): Promise<Assessment>   // rejects bad responses

// Runs on EC2, in the background after the button is pressed
runComparison({ repo, llm, store, now }): Promise<void>

// Results store
saveMvp(content, now): MvpId
start(mvpId, now): ComparisonId | AlreadyRunning
succeed(comparisonId, result: Assessment, now)
fail(comparisonId, reason, now)
view(now): { mvp, latest: Snapshot | null, state: "idle" | "running" | { failed: reason } }

// Timeline page
buildTimeline(view, today): TimelineModel       // pure; runs in the browser

// Sign-in
admit(githubUserId): boolean
```

- **MVP reader (`parseMvp`):** turns `MVP.md` into deliverables with deadlines and done criteria, and reports what's missing or malformed. Deliverables and criteria get IDs by position (`d1`, `d1.c1`), so the same file always parses the same way.
- **GitHub access (`RepoSource`):** the only module that calls GitHub's API for repo contents. It hides tokens, fetching and pagination, and has a GitHub adapter and a fake for tests. `readMvpFile` serves page reloads, and `read` serves comparisons.
- **Comparison (`assess`):** takes the MVP and code, chooses what to send, excludes secrets, asks the LLM, and validates the response. The LLM must give a verdict on every done criterion: met, or not met with tasks. A missing or unknown criterion, an unknown deliverable, or a not-met criterion with no tasks is a failed comparison. `assess` works out "done" itself, so a skipped deliverable can't be marked finished.
- **`runComparison`:** reads and saves `MVP.md`, starts a comparison against it, reads the code, runs `assess`, and saves the result or the failure. It owns the order of steps and turns failures into stored states.
- **Results store (`ResultsStore`):** the only module that talks to RDS. `saveMvp` stores each distinct version of `MVP.md` once. `start` is atomic, so a double press can't start two comparisons. A comparison still "running" past a time limit counts as failed, as does any comparison left "running" when the server starts, so a crash can't block the button forever. The page shows the latest succeeded comparison, so a failure never replaces earlier results. The last valid MVP is the newest stored version that parses.

**Database schema**

The schema is in `backend/db/001_init.sql`.

| Table | One row per | Columns |
|---|---|---|
| `mvp` | Distinct version of `MVP.md` | `content` (the file as read), `content_hash` (unique sha256), `first_seen_at`, `last_seen_at` |
| `comparisons` | Press of Compare with code | `status` (`running`, `succeeded` or `failed`), `mvp_id` (the version compared), `result` (the validated AI response, as JSONB), `failure`, `started_at`, `finished_at` |

- **Nothing parsed is stored:** the server parses `content` when it reads it. Parsing is quick and gives the same result for the same file, so the file is the only source of truth.
- **One running comparison at a time:** a partial unique index on `comparisons` where `status = 'running'` makes a second start fail.
- **The MVP-changed notice:** it appears when the newest `mvp` row differs from the one the latest succeeded comparison used.
- **`result` is JSONB, not separate tables:** the app always reads and writes a whole result at once, and `assess` checks its shape.
- **Timeline page:** renders `buildTimeline`'s output, matching the mockup. `buildTimeline` runs in the browser so "today" and days left use my local date.
- **Sign-in (`admit`):** handles GitHub sign-in and rejects every account but mine, by numeric GitHub user ID because usernames can change and be reclaimed.

**Decisions made**

- There is one user and one tracked repo.
- `MVP.md` sits at the repo root. The app never writes it.
- The comparison runs only on a button press.
- GitHub is read-only. The app ignores GitHub's milestones and Projects.
- **Starting a comparison:** the API returns immediately, EC2 runs the comparison in the background, and the page polls for the run's state. If EC2 restarts mid-run, that run counts as failed, and earlier results stay in place.
- **Refreshing the MVP:** after sign-in, every reload reads `MVP.md` from EC2 and saves it if it changed, with no LLM call. Each comparison records which version of `MVP.md` it used. There is no refresh button. A signed-out visitor can't trigger a GitHub read.
- **GitHub App:** a registration on GitHub plus credentials, not a separately hosted service. Sign-in uses a user token and repo reads use an installation token, and both call GitHub's API. Webhooks are off because comparisons only run on a button press. It's installed only on the tracked repo with read-only Contents access, which was confirmed on 2026-11-05: it could read this repo, couldn't read another private repo, and couldn't write.
- **Theme:** the page uses GitHub's light and dark colors and system fonts, and follows the device's setting with no toggle. Status icons follow GitHub's issue style: a hollow green circle for open, a filled purple check for done, and a dashed gray circle for not compared yet.
- **Compare button:** it's disabled when `MVP.md` is missing or invalid, because a run couldn't succeed.
- **Done criteria are checkable from the repo:** the comparison only sees files, so anything set up outside the code, such as billing alerts or GitHub App settings, is recorded in a doc in the repo.

**Still to decide**

- **The exact format of `MVP.md`:** deliverable, deadline, and done criteria are required. This repo's `MVP.md` uses a draft format, to be settled when the MVP reader is built in deliverable 2.
- **Which LLM to use:** its cost was not part of the research.
- **How much code to send to the LLM:** a repo may not fit in one request, and secrets must not be sent.

## Testing Decisions

- A good test checks external behavior, not implementation details. Tests should still pass after an internal rewrite.
- The main seam is the comparison: given an MVP and a set of code files, with a fake LLM, `assess` returns a verdict for every criterion and tasks grouped by deliverable. It's also tested for failed and malformed LLM responses, a response that skips a criterion, and a secret file never reaching the prompt.
- The MVP reader is tested directly with valid, incomplete, and malformed files.
- Sign-in is tested for one thing that matters most: any account but mine is refused.
- `runComparison` is tested with a fake `RepoSource`, a fake LLM and a real store on PGLite, to show a failed comparison leaves earlier results in place and a double press can't start a second run.
- `buildTimeline` is tested directly for days left, overdue deliverables, and done versus open.
- AWS wiring is checked by running deliverable 1 for real, since working through that is the point.

## Out of Scope

- Lambda (dropped on 2026-11-07; a possible later home for the comparison, so a server restart can't lose a run)
- `.yaml` config (possibly useful later for files to leave out of LLM prompts)
- Scheduled checks and warnings
- Other users
- Several repos
- Analytics
- A security analyzer
- Public link scanning
- Code quality and security context in the prompt
- Commit history on the page
- Syncing with GitHub milestones
- Creating `MVP.md` inside the app
- Integrations with Trello, Azure DevOps, or other trackers

## Further Notes

**Deliverables and deadlines**

| # | Deliverable | Due |
|---|---|---|
| 1 | AWS path: EC2 reads the repo from GitHub through the GitHub App and saves a row in RDS | 2026-11-10 |
| 2 | Comparison: EC2 reads `MVP.md` and the code, asks an LLM what's left, and saves the tasks by deliverable | 2026-11-14 |
| 3 | Timeline page: the React app on S3 and CloudFront, reading from the EC2 API, on my domain over HTTPS | 2026-11-21 |
| 4 | GitHub sign-in: user sign-in through the GitHub App, limited to my account | 2026-11-27 |
| 5 | One real project: I run a real project through it | 2026-11-28 |

Done criteria for each deliverable are in `MVP.md`.

**Finish line:** the EC2, RDS, S3 and CloudFront goals are met, and the tool is usable for myself. Showing it to others is optional.

**Cost:** research estimated about $24.40/month after credits in us-east-1 for the EC2, RDS, storage, and public IP, excluding LLM calls. S3 and CloudFront should add very little at one user's traffic, and a domain adds its yearly fee. There's no NAT gateway, so recheck the estimate once everything is running. New AWS accounts get limited credits rather than a 12-month free allowance. RDS keeps billing until it's deleted, and restarts itself after 7 days if stopped.

**What this design gives up:**
- **Lambda:** I won't learn Lambda in this project, which was part of the original motive.
- **Comparisons depend on the server:** they run inside the EC2 process, so a restart mid-run loses that run.

**References**

- [Timeline page mockup](https://claude.ai/artifact/NnPCiaT4urcfe97bmUEL6r) (every page state in both themes; example data; private to me)
- Research findings: `~/.agents/checkpoints/mvp-tracker/RESEARCH.md`
- Saved scope: `~/.agents/checkpoints/mvp-tracker/SCOPE.md`
