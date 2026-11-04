# mvp-tracker spec

A page that compares `MVP.md` with your code and shows the tasks left on a timeline, built to learn Lambda, EC2 and RDS.

## Problem Statement

I start projects without set deadlines, done criteria, or an attainable MVP. Stride, for example, had task tracking but no MVP, and I burned out on endless UX improvements because nothing defined "good enough". GitHub's milestones and roadmap can hold dates, but they only know what I type into them, so they can't tell me what my code still lacks.

I also want to learn AWS by building something real. I can't yet deploy a Lambda, host a page on EC2, or store data in RDS.

## Solution

I write an `MVP.md` in a repo, listing deliverables with a deadline and done criteria for each. I sign in with GitHub and open a page showing those deliverables on a timeline. The page refreshes the plan from `MVP.md` on every reload, before any comparison has run. When I press "Compare with code", an LLM compares `MVP.md` with the repo's code and lists the tasks left, grouped by deliverable and tied to done criteria. Results are saved, so they're still there when I come back.

The system runs on Lambda, EC2, and RDS, which is the main reason for building it. A cheaper stack may be possible, but learning these services is the goal.

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

31. As the user, I want to deploy a Lambda that calls the GitHub API, so that I learn how Lambda works with an outside API.
32. As the user, I want to host the page on EC2, so that I learn how to run a server on AWS.
33. As the user, I want to store repo data and results in RDS, so that I learn how to run a database on AWS.
34. As the user, I want billing alerts in place from the start, so that a mistake doesn't turn into a surprise bill.

**Keeping the plan current**

35. As the user, I want the page to refresh the plan from `MVP.md` on every reload, so that the timeline matches the file without an LLM call.
36. As the user, I want to see my deliverables before the first comparison, so that the timeline is useful right away.
37. As the user, I want to see the saved plan and a notice when GitHub can't be reached, so that a GitHub outage doesn't blank the page.
38. As the user, I want to keep seeing my last valid plan when `MVP.md` becomes invalid, so that a typo doesn't hide my project.
39. As the user, I want a notice when `MVP.md` has changed since the last comparison, so that I know the tasks may be out of date.

**Theme**

40. As the user, I want the page to use GitHub's light and dark colors and follow my device's setting, so that it feels at home beside my repos.

## Implementation Decisions

**Modules**

The sketches below use TypeScript notation, but the language is not chosen yet.

```ts
// MVP reader
parsePlan(markdown): Plan | { problems: Problem[] }

// GitHub access
interface RepoSource {
  readPlanFile(): Promise<string | null>   // null if there's no MVP.md
  read(): Promise<RepoFile[]>
}

// Comparison
interface Llm { complete(prompt: string): Promise<string> }
assess(plan, files, llm): Promise<Assessment>   // rejects bad responses

// Runs in Lambda, with no database access
analyze(repo, llm): Promise<{ plan, assessment } | Failure>

// Runs on EC2, and calls the Lambda through this port
interface Analyzer { run(): Promise<{ plan, assessment } | Failure> }
runComparison({ analyzer, store, now }): Promise<void>

// Results store
savePlan(planOrProblems, now)
start(now): RunId | AlreadyRunning
succeed(runId, plan, assessment, now)
fail(runId, reason, now)
view(now): { plan, latest: Snapshot | null, state: "idle" | "running" | { failed: reason } }

// Timeline page
buildTimeline(view, today): TimelineModel       // pure; the page only renders this

// Sign-in
admit(githubUserId): boolean
```

- **MVP reader (`parsePlan`):** turns `MVP.md` into deliverables with deadlines and done criteria, and reports what's missing or malformed.
- **GitHub access (`RepoSource`):** the only module that calls GitHub's API for repo contents. It hides fetching and pagination, and has a GitHub adapter and a fake for tests. Lambda uses `read` for the code. EC2 uses `readPlanFile` on reload.
- **Comparison (`assess`):** takes the plan and code, chooses what to send, excludes secrets, asks the LLM, and validates the response. The LLM must give a verdict on every done criterion: met, or not met with tasks. A missing or unknown criterion, an unknown deliverable, or a not-met criterion with no tasks is a failed comparison. `assess` works out "done" itself, so a skipped deliverable can't be marked finished.
- **`analyze`:** reads the repo, parses the plan, runs `assess`, and returns the result. The Lambda handler only builds its dependencies and calls this.
- **`runComparison`:** owns the order of steps on EC2 and turns failures into stored states.
- **Results store (`RunStore`):** the only module that talks to RDS. It saves the current plan and the latest run. `start` is atomic, so a double press can't start two runs. A run still "running" after the Lambda timeout counts as failed, so a crash can't block the button forever. A successful run saves its plan with its results.
- **Timeline page:** renders `buildTimeline`'s output, matching the mockup.
- **Sign-in (`admit`):** handles GitHub sign-in and rejects every account but mine, by numeric GitHub user ID because usernames can change and be reclaimed. It's separate from repo access, which uses a different credential.

**Decisions made**

- There is one user and one tracked repo.
- `MVP.md` sits at the repo root. The app never writes it.
- The comparison runs only on a button press.
- GitHub is read-only. The app ignores GitHub's milestones and Projects.
- **Where each part runs:**
  - **EC2:** holds the GitHub App's private key, handles sign-in, creates short-lived repo tokens, reads `MVP.md` on reload, and is the only thing that talks to RDS.
  - **Lambda:** receives a token from EC2, reads the repo's code, calls the LLM, and returns the result. It must never log the token. It runs outside a VPC, so it needs no NAT gateway to reach GitHub or the LLM.
  - **RDS:** stays private and accepts connections only from EC2.
- **Starting a comparison:** the button returns immediately, EC2 waits on the Lambda in the background, and the page polls for the run's state. Only EC2 can invoke the Lambda, through IAM, and the Lambda has no public URL. AWS SDK retries are off for this call, and its timeout is longer than the Lambda's, so a slow run can't be retried and charged twice. If EC2 restarts mid-run, that result is lost and the run counts as failed once the timeout passes.
- **Refreshing the plan:** after sign-in, every reload reads `MVP.md` directly from EC2, with no Lambda or LLM call. A comparison saves the plan it used along with its results. There is no refresh button. A signed-out visitor can't trigger a GitHub read.
- **GitHub App:** a registration on GitHub plus credentials, not a separately hosted service, so no extra host is needed. Sign-in uses a user token and repo reads use an installation token, and both call GitHub's API. Webhooks are off because comparisons only run on a button press. It's limited to the chosen repo with read-only Contents access. That limit rests on memory of GitHub's permission model, so confirm it during deliverable 1.
- **Theme:** the page uses GitHub's light and dark colors and system fonts, and follows the device's setting with no toggle. Status icons follow GitHub's issue style: a hollow green circle for open, a filled purple check for done, and a dashed gray circle for not compared yet.
- **Compare button:** it's disabled when `MVP.md` is missing or invalid, because a run couldn't succeed.
- **Done criteria are checkable from the repo:** the comparison only sees files, so anything set up outside the code, such as billing alerts or GitHub App settings, is recorded in a doc in the repo.

**Still to decide**

- **The exact format of `MVP.md`:** deliverable, deadline, and done criteria are required. This repo's `MVP.md` uses a draft format, to be settled when the MVP reader is built in deliverable 2.
- **Which LLM to use:** its cost was not part of the research.
- **How much code to send to the LLM:** a repo may not fit in one request, and secrets must not be sent.
- **Which language to use:** the interfaces above are only sketches.

## Testing Decisions

- A good test checks external behavior, not implementation details. Tests should still pass after an internal rewrite.
- The main seam is the comparison: given a plan and a set of code files, with a fake LLM, `assess` returns a verdict for every criterion and tasks grouped by deliverable. It's also tested for failed and malformed LLM responses, a response that skips a criterion, and a secret file never reaching the prompt.
- The MVP reader is tested directly with valid, incomplete, and malformed files.
- Sign-in is tested for one thing that matters most: any account but mine is refused.
- `runComparison` is tested with a fake `Analyzer` and a real store on a local Postgres stand-in, to show a failed comparison leaves earlier results in place and a double press can't start a second run.
- `buildTimeline` is tested directly for days left, overdue deliverables, and done versus open.
- AWS wiring is checked by running deliverable 1 for real, since working through that is the point.
- There is no prior art, because this is a new repo.

## Out of Scope

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
| 1 | AWS path: a Lambda reads the repo from GitHub through the GitHub App, and EC2 saves a row in RDS | 2026-11-07 |
| 2 | Comparison: the Lambda reads `MVP.md` and the code and asks an LLM what's left, and EC2 saves the tasks by deliverable | 2026-11-14 |
| 3 | Timeline page: hosted on EC2, reading from RDS, and refreshing the plan on reload | 2026-11-21 |
| 4 | GitHub sign-in: user sign-in through the GitHub App, limited to my account | 2026-11-27 |
| 5 | One real project: I run a real project through it | 2026-11-28 |

Done criteria for each deliverable are in `MVP.md`.

**Finish line:** the Lambda, EC2, and RDS goals are met, and the tool is usable for myself. Showing it to others is optional.

**Cost:** research estimated about $24.40/month after credits in us-east-1 for the EC2, RDS, storage, and public IP, excluding LLM calls. This design needs no NAT gateway or public database, so the $60.90 and $28.05 options researched earlier no longer apply, but the $24.40 estimate should be rechecked. New AWS accounts get limited credits rather than a 12-month free allowance. RDS keeps billing until it's deleted, and restarts itself after 7 days if stopped.

**What this design gives up:** with the Lambda outside a VPC, I won't learn how to run a Lambda inside a private network. I accepted this to avoid the NAT gateway and a public database.

**References**

- [Timeline page mockup](https://claude.ai/artifact/NnPCiaT4urcfe97bmUEL6r) (every page state in both themes; example data; private to me)
- Research findings: `~/.agents/checkpoints/mvp-tracker/RESEARCH.md`
- Saved scope: `~/.agents/checkpoints/mvp-tracker/SCOPE.md`
