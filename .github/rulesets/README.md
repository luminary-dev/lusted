# Branch rulesets

What GitHub should enforce on the two branches, as rulesets ready to apply (`.github/rulesets/*.json`):

- **main** — no direct pushes: changes arrive by pull request, merged as a merge commit (never squashed or rebased, so
  the production deploy can see it came from `dev`); every CI check must pass on a branch that is up to date with
  `main`; review threads resolved; no force-pushes, no deleting the branch. No approvals are required (a one-person
  repository can't approve its own pull request) — raise `required_approving_review_count` when there are two of you.
- **dev** — no force-pushes and no deleting the branch. Pushing straight to it stays allowed; that is the workflow.

GitHub only offers rulesets to private repositories on GitHub Pro / Team, or to public ones. Until the plan changes,
`.github/workflows/ci.yml` enforces the `main` rules itself (the "Branch rules" job and the deploy job's merge check).
When rulesets become available, apply both with:

```bash
scripts/apply-rulesets.sh          # creates them, or updates them if they already exist
```

or import each file by hand: repository Settings → Rules → Rulesets → New ruleset → Import a ruleset.

If a job is renamed in `ci.yml`, rename it in `main.json` too — a required check that never reports blocks every merge.
