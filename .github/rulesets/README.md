# Branch rulesets

What GitHub should enforce on the two branches, as rulesets ready to apply (`.github/rulesets/*.json`). The two are
the same rule, applied to `main` and to `dev`:

- changes arrive only by pull request, merged as a merge commit (never squashed or rebased — the deploy job tells a
  merged pull request from a direct push by the merge commit);
- the pull request's branch must be up to date with its base, and every check must pass on it: Branch rules, Lint and
  types, Tests (1/6 … 6/6), Lighthouse (home, shop, product, about, help), CodeQL (javascript-typescript, actions), Dependency
  review, Workflow lint and Secrets scan;
- code scanning merge protection: a merge may not add a high-severity CodeQL finding or an analysis error;
- review threads resolved; no force-pushes; the branch can't be deleted.

No approvals are required (a one-person repository can't approve its own pull request) — raise
`required_approving_review_count` when there are two of you. On top of these, the workflow's Branch rules job only
lets `dev` into `main`.

The repository is public, so both rulesets are live on GitHub (Settings → Rules → Rulesets). The workflow enforces
the same on its side — a pull request that is behind its base, or into `main` from anywhere but `dev`, goes red; a
direct push to either branch runs the checks but is never deployed — and the repository's merge settings allow merge
commits only. After editing a file here, apply both with:

```bash
scripts/apply-rulesets.sh          # creates them, or updates them if they already exist
```

or import each file by hand: repository Settings → Rules → Rulesets → New ruleset → Import a ruleset.

If a job is renamed in `ci.yml`, rename it here too — a required check that never reports blocks every merge.
