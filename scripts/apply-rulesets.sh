#!/usr/bin/env bash
# Applies the branch rulesets in .github/rulesets to this repository through the GitHub API (needs `gh` logged in with
# admin on the repository). Creates each ruleset, or updates the one with the same name if it already exists.
# GitHub refuses with 403 on a private repository under a free plan — see .github/rulesets/README.md.
set -euo pipefail
cd "$(dirname "$0")/.."
repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
existing="$(gh api "repos/$repo/rulesets" --jq '.[] | "\(.id)\t\(.name)"' 2>/dev/null || true)"
for f in .github/rulesets/*.json; do
  name="$(jq -r .name "$f")"
  id="$(printf '%s\n' "$existing" | awk -F'\t' -v n="$name" '$2 == n { print $1; exit }')"
  if [ -n "$id" ]; then
    gh api -X PUT "repos/$repo/rulesets/$id" --input "$f" --jq '"updated  \(.name)"'
  else
    gh api -X POST "repos/$repo/rulesets" --input "$f" --jq '"created  \(.name)"'
  fi
done
