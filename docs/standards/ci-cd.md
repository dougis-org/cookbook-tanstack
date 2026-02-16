# CI/CD Workflow Standards

## CI/CD is Authoritative

**CI/CD validation is the source of truth for merge readiness.** All checks run on CI/CD are binding, and results override local analysis.

### Why CI/CD is Authoritative

- Runs on clean environment (eliminates local "works on my machine")
- Uses consistent tool versions across all PRs  
- Maintains audit trail of all checks
- Enforces non-repudiation (changes recorded in history)
- Can be reproduced by any contributor

## Local vs CI Validation

### Local Analysis
- **Scope:** Supplementary feedback during development
- **Timing:** Optional, ad-hoc runs during work
- **Authority:** Informational only
- **Use it for:** Fast feedback loop, catch obvious issues early
- **Don't rely on it:** Final gate before merge

### CI/CD Validation
- **Scope:** Complete, authoritative checks on all PRs
- **Timing:** Automatic on every PR
- **Authority:** Binding, determines merge readiness
- **Use it for:** Final validation before merge
- **Guarantees:** Reproducible, auditable, consistent

## Before Creating a Pull Request

These must all pass locally or be acceptable to fix in PR:

- ✅ Code compiles/runs without errors (`npm run build`, `npm run dev`)
- ✅ Tests pass (`npm run test`, `npm run test:e2e`)
- ✅ TypeScript strict mode (`npx tsc --noEmit`)
- ⚠️ Optional: Run optional tools locally for feedback

## Pull Request Requirements

A PR is ready to merge when:

1. **All automated checks pass** on CI/CD (required)
   - Test suite passes (unit + E2E)
   - TypeScript compilation succeeds
   - Security scans clean (no blocker vulnerabilities)
   - Code quality checks pass (no critical issues)
   - Linting passes (or marked as acceptable)

2. **Code review approved** (required)
   - Minimum 1 approval for normal PRs
   - Senior review for architectural changes

3. **Merge conflicts resolved** (required if applicable)

4. **Commits squashed or clean** (project preference)

## What CI/CD Checks

Standard CI/CD pipeline (Build and Test workflow) runs:

- **Build:** Vite build succeeds, assets generated
- **TypeScript:** Type checking with strict mode
- **Tests:** Unit tests (Vitest) + Integration tests + E2E tests (Playwright)
- **Coverage:** Test coverage consolidated and reported to Codacy
- **Security:** Dependency scanning (Snyk) + container scanning (Trivy)
- **Code Quality:** Issue detection (Codacy) + linting

## What CI/CD Does NOT Check

Do not rely on CI/CD for:

- **Code metrics (optional):** Duplication, complexity, coverage percentages
  - Metrics are informational, not gate conditions
  - Focus on fixing issues, not optimizing metrics
- **Style preferences:** Beyond what linters enforce
- **Architecture decisions:** Beyond what schema/types enforce

## Handling CI/CD Failures

### PR Fails CI/CD

1. Review failure reason
2. Check which check failed (test, security, quality, build)
3. If local, fix locally and push
4. If environment-specific, may require CI/CD environment investigation
5. Contact maintainers if unable to resolve

### Flaky/Intermittent Failures

- If test is flaky: Fix test to be deterministic
- If tool fails intermittently: Run again, file issue if persistent
- If environment is unstable: Raise with maintainers

## Deployment & Release

Only merge to release branches when:
- All CI/CD checks pass
- All reviews approved
- Changelog updated  
- Version bumped (if applicable)

After merge to main:
- Automated release process may trigger
- Monitor deployment status
- Verify in deployed environment

## Development Workflow Summary

```
Local Development
  ↓
Optional: Local analysis for feedback
  ↓
Create PR
  ↓
Automated CI/CD runs (AUTHORITATIVE)
  ↓
Fix failures (if any)
  ↓
CI/CD passes + Review approved
  ↓
Merge to main
  ↓
(Optional) Deploy to production
```

## For Test-Driven Development Details

See [Code Quality Standards](./code-quality.md) for TDD workflow and testing strategy.

## For Local Analysis Details  

See [Analysis & Security Standards](./analysis-and-security.md) for when and how to run optional local analysis.
