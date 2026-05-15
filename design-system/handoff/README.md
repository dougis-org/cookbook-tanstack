# Claude Code handoff — UX audit work

This folder is the deliverable for the May 2026 UX audit. It contains:

1. **`design-system/`** — the design system folder. Drop into your repo at `cookbook-tanstack/design-system/` so the issues and Claude Code can reference it.
2. **`issues/`** — Markdown bodies for **new** GitHub issues (the ones not already in the repo).
3. **`comments/`** — Markdown bodies to **paste as comments** on pre-existing issues so the design context from the audit folds into the existing work instead of duplicating it.
4. **`create-issues.sh`** — bulk-create script. Skips the duplicates by default.

---

## Step 1 — drop the design system into the repo

The `design-system/` folder in here is the latest version (includes the adblock-naming rule in `CLAUDE.md` that wasn't in the previously-delivered bundle). From the cookbook-tanstack working copy:

```bash
# remove any existing design-system folder, then copy the new one
rm -rf design-system
cp -R /path/to/this/handoff/design-system .
git add design-system
git commit -m "Update design-system: adblock-safe naming rule + funnel mocks reference"
```

The root `CLAUDE.md` should already include `@design-system/CLAUDE.md` from the earlier landing — verify and add if missing.

---

## Step 2 — reconcile duplicates already on GitHub

The bulk `create-issues.sh` from the first round landed F02–F11 as #447–#455. Two of those duplicate work already in the repo:

| New issue | Pre-existing issue | Action |
| --- | --- | --- |
| **#453** (F09 — Pricing v2) | **#430** (subscription pricing page) | Comment design context on #430, close #453 |
| **#455** (F11 — Brand name hero) | **#446** (Refactor site title) | Comment design context on #446, close #455 |

For each pair:

1. Open the pre-existing issue (#430 or #446)
2. Paste the matching comment body from `comments/` and post
3. Open the duplicate (#453 or #455) and close it with a comment pointing to the original

```bash
# example for the pricing pair
gh issue comment 430 --body-file comments/on-430-pricing-design-context.md
gh issue close 453 --comment "Closing — design context folded into #430."

gh issue comment 446 --body-file comments/on-446-title-design-context.md
gh issue close 455 --comment "Closing — design context folded into #446."
```

---

## Step 3 — add design context to the Stripe Checkout issue (#426)

The audit's F01 was correctly not created as a new issue — #426 (Stripe Checkout flow) already covers it, and the related Stripe work is split across #426–#429 + #431.

To make sure Claude Code picks up the design constraints from the audit when it works on these:

```bash
gh issue comment 426 --body-file comments/on-426-stripe-checkout-design-context.md
```

This comment names the entry-point surfaces (#430, #451, #449, #450) so whoever picks up #426 wires them all into the same mutation.

---

## Step 4 — net-new issues

These don't have a pre-existing equivalent. They were created by the first run of `create-issues.sh`:

| Issue | Finding |
| --- | --- |
| #447 | F02 — Render sponsored content on free-tier authed pages |
| #448 | F03 — Rewrite landing page to sell the product |
| #449 | F05 — Progressive paywall nudges |
| #450 | F06 — Dashboard home |
| #451 | F07 — Account upgrade CTA |
| #452 | F08 — Defer email verification |
| #454 | F10 — Register benefits sidebar |

These are good as-is. F04 (top-tier feature placement) is a **strategic** call that isn't a build task — no issue.

If for any reason these weren't created (or you want to recreate them in a different repo), the source markdown is in `issues/` and `create-issues.sh` is idempotent-safe by virtue of skipping the duplicates explicitly.

---

## Re-running `create-issues.sh`

The script now **only creates the net-new issues** (F02, F03, F05, F06, F07, F08, F10). It will not attempt to re-create F09 or F11. F01 is also absent — see Step 3 instead.

```bash
cd /path/to/cookbook-tanstack
bash /path/to/this/handoff/create-issues.sh
```

Run it once. The script will create duplicate issues if run a second time — review `gh issue list --label ux-audit` before re-running.

---

## What's actually in each markdown file

### `issues/F0X-*.md`
Self-contained issue body, ending with `@claude` to trigger Claude Code on new-issue-creation.

### `comments/on-NNN-*.md`
Issue **comment** body — no leading `#` title. Designed to paste into an existing issue's comment box.

---

## A note on scope

These artefacts are **scoped for Claude Code**, not for humans:

- Reference real file paths and line numbers
- Quote the design-system rules that apply (theme tokens, no emoji, adblock-safe classnames)
- Include acceptance criteria a CI test could enforce
- Skip strategic decisions that need a human ("should we even raise the price?")

For a fuller human-readable PRD on any one, ask and I'll write it.
