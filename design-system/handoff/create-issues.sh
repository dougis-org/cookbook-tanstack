#!/usr/bin/env bash
# Bulk-create GitHub issues for the UX audit findings.
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

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI not installed — see https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh not authenticated — run 'gh auth login'" >&2
  exit 1
fi

# Verify we're inside a git repo and that gh resolves a repo target.
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
if [[ -z "$REPO" ]]; then
  echo "❌ gh can't resolve a repo. Run this from inside cookbook-tanstack" >&2
  echo "   or pass --repo dougis-org/cookbook-tanstack to gh commands." >&2
  exit 1
fi

echo "→ Creating issues in $REPO"

# Make sure labels exist (gh label create is idempotent-ish: errors on
# duplicates, hence the || true).
gh label create "ux-audit"    --color "fbca04" --description "Findings from the May 2026 UX audit" 2>/dev/null || true
gh label create "claude-task" --color "5319e7" --description "Tagged for Claude Code GitHub App" 2>/dev/null || true

count=0
for md in "$ISSUES_DIR"/*.md; do
  # First line is "# Title" — strip the marker.
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
echo "✓ Created $count issues. View: gh issue list --label ux-audit"
