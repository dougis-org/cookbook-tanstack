#!/usr/bin/env bash
# Bulk-create the NET-NEW GitHub issues for the UX audit findings.
#
# IMPORTANT: this script SKIPS F09 and F11 because they duplicate
# pre-existing issues (#430 and #446). For those, paste the matching
# files from comments/ as comments on the existing issues instead.
# See README.md for the full workflow.
#
# F01 is also skipped — already covered by #426 (Stripe Checkout flow)
# and the related #427–#429, #431 family.
#
# Usage:  bash create-issues.sh
# Run from anywhere — script `cd`s to its own directory first.
#
# Requirements:
#   - `gh` CLI installed and authenticated (`gh auth status`)
#   - Run from inside (or pointing at) the cookbook-tanstack working copy
#
# Each issue:
#   - title is the first line of the .md file (stripped of leading "# ")
#   - body is the full file content
#   - labels: ux-audit + claude-task (created on demand)

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ISSUES_DIR="${SCRIPT_DIR}/issues"

# Issues already covered by pre-existing GitHub issues — never create as new.
SKIP_PATTERNS=(
  "F01-"   # already covered by #426 (Stripe Checkout) + #427–#429, #431
  "F09-"   # dup of #430 — comment via comments/on-430-pricing-design-context.md
  "F11-"   # dup of #446 — comment via comments/on-446-title-design-context.md
)

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI not installed — see https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh not authenticated — run 'gh auth login'" >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
if [[ -z "$REPO" ]]; then
  echo "❌ gh can't resolve a repo. Run this from inside cookbook-tanstack" >&2
  echo "   or pass --repo dougis-org/cookbook-tanstack to gh commands." >&2
  exit 1
fi

echo "→ Creating issues in $REPO"
echo "→ Skipping (pre-existing): ${SKIP_PATTERNS[*]}"

gh label create "ux-audit"    --color "fbca04" --description "Findings from the May 2026 UX audit" 2>/dev/null || true
gh label create "claude-task" --color "5319e7" --description "Tagged for Claude Code GitHub App" 2>/dev/null || true

count=0
skipped=0
for md in "$ISSUES_DIR"/*.md; do
  basename="$(basename "$md")"
  skip=0
  for pattern in "${SKIP_PATTERNS[@]}"; do
    if [[ "$basename" == ${pattern}* ]]; then
      echo "↷ Skipping $basename (pre-existing equivalent)"
      skip=1
      skipped=$((skipped + 1))
      break
    fi
  done
  [[ "$skip" -eq 1 ]] && continue

  title="$(head -n 1 "$md" | sed -E 's/^#[[:space:]]+//')"
  echo ""
  echo "→ Creating: $title"
  gh issue create \
    --title "$title" \
    --body-file "$md" \
    --label "ux-audit,claude-task" \
    --repo "$REPO"
  count=$((count + 1))
done

echo ""
echo "✓ Created $count issues, skipped $skipped (already covered)."
echo "  Next: handle the skipped findings via comments/ — see README.md Step 2 & 3."
echo "  View: gh issue list --label ux-audit --repo $REPO"
