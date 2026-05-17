# Claude Code handoff — UX audit work

This folder packages the UX audit findings as **ready-to-create GitHub issues**
that Claude Code (the GitHub Action) can pick up directly. Each issue is
self-contained, has clear acceptance criteria, references real file paths,
and ends with an `@claude` mention to trigger the action.

---

## Prerequisites

1. **Install the Claude GitHub App** in `dougis-org/cookbook-tanstack` if it
   isn't already: https://github.com/apps/claude
2. **Authenticate `gh` CLI locally:** `gh auth login` (one-time, picks up
   credentials from `~/.config/gh/`).
3. **Make sure the `design-system/` folder has landed in `main`** (the
   issues reference paths inside it).

---

## Quick start — bulk-create all issues

From the repo root:

```bash
cd path/to/cookbook-tanstack
bash path/to/this/folder/create-issues.sh
```

The script reads every `.md` file in `issues/` and creates one GitHub issue
per file, using the filename for the issue title prefix. Run it once.

The script is idempotent only in the sense that it will create duplicate
issues if run twice — review `gh issue list` before re-running.

---

## Cherry-pick one issue

```bash
cd path/to/cookbook-tanstack
gh issue create \
  --title "$(head -n 1 path/to/issues/F01-stripe-checkout.md | sed 's/^# //')" \
  --body-file path/to/issues/F01-stripe-checkout.md \
  --label "ux-audit,claude-task"
```

Or just open the `.md` file, copy its contents into the GitHub UI's
"Create issue" form, and submit.

---

## How Claude Code picks them up

Each issue body ends with `@claude` plus a short framing line. When the
GitHub App sees that mention on a new issue (or comment), it:

1. Reads the issue title + body
2. Clones the repo and creates a branch
3. Makes the changes
4. Opens a PR linked back to the issue

You stay in the loop via the PR. Approve / request changes / merge as
usual.

---

## What's inside

| File | Finding | Severity | Sprint |
| --- | --- | --- | --- |
| `F01-stripe-checkout.md` | Checkout doesn't exist | Fatal | 1 |
| `F02-ads-on-authed-pages.md` | Prep Cook value isn't felt | Fatal | 2 |
| `F03-landing-rewrite.md` | Hero + features don't sell | High | 4 |
| `F05-paywall-nudges.md` | No 70%/90% nudges | Medium | 3 |
| `F06-dashboard-home.md` | /home is a links menu | Medium | 3 |
| `F07-account-cta.md` | Upgrade is a text link | Medium | 3 |
| `F08-defer-email-verify.md` | Verify blocks first value | Medium | 4 |
| `F09-pricing-v2.md` | Pricing page is sparse | Medium | 2 |
| `F10-register-benefits.md` | Register form is dry | Low | 4 |
| `F11-brand-name-hero.md` | "CookBook" not "My CookBooks" | Low | 1 |

F4 ("decide whether Import + Private stay at top tiers") is a
**strategic** decision, not a build task — no issue. Discuss it instead.

The order roughly matches the four-phase roadmap in `ux-audit.html`:
unblock revenue → make the existing ladder felt → move users through →
polish acquisition.

---

## A note on scope

These are **scoped for Claude Code**, not for humans. They:

- Reference specific files and line numbers in the repo
- Quote the design-system rules that apply (theme tokens, no emoji,
  adblock-safe classnames)
- Include acceptance criteria a CI test could enforce
- Skip strategic decisions that need a human ("should we even raise the
  price?")

If you want a fuller human-readable PRD for any one, ask and I'll write it.
