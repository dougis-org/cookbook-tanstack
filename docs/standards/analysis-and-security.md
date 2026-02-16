# Analysis & Security Standards

## Local Code Analysis

### When to Run Local Analysis

Local analysis provides fast feedback during development and is *optional but recommended*:

- After any successful file edit or code change
- When seeking immediate feedback on code quality issues
- To catch issues before CI/CD validation

### Important Limits

❌ **Do NOT run analysis for:**
- Duplication metrics
- Complexity metrics  
- Code coverage metrics

✅ **DO run analysis for:**
- Actual code quality issues (bugs, anti-patterns, maintainability)
- Security vulnerabilities
- Linting errors and style violations

### Why Local Analysis is Optional

- CI/CD scans are **authoritative** and run on all PRs
- Local scans supplement but don't replace CI/CD validation
- No installation required; use MCP Server tools instead of CLI

### Local Analysis Workflow

1. Run analysis tool for changed file(s)
2. If issues found: propose and apply fixes
3. Continue with task if tool unavailable

## Security Scanning

### When to Run Security Scans

Run security scans after any of these actions:

- `npm install` / `yarn install` / `pnpm install` (or equivalent)
- Adding dependencies to `package.json` or other dependency files
- Adding requirements to `requirements.txt`
- Adding dependencies to `pom.xml` or `build.gradle`
- Any other package manager operations
- New first-party code in security-scanning-supported languages

### Security Scan Workflow

1. Run security scan tool on relevant files or project
2. If vulnerabilities found:
   - Propose fixes for security issues
   - Apply fixes automatically if possible
   - Rescan to ensure issues resolved
3. Only proceed with original task after all issues addressed
4. Repeat until no new security issues found

### Vulnerability Remediation

**Priority order:**
1. **Critical/High:** Fix immediately, block further work until resolved
2. **Medium:** Fix before merge
3. **Low:** Fix before merge if practical

**When unable to fix:**
1. Document the reason (e.g., dependency upstream issue)
2. Mark as acknowledged in CI/CD configuration
3. Create tracking issue for follow-up
4. Escalate if security advisory is active

## Issue Remediation Workflow

When analysis tools find issues:

1. **Categorize:** Group by severity and type
2. **Propose:** Suggest fixes with context
3. **Apply:** Implement fixes automatically when safe
4. **Verify:** Re-run analysis to confirm resolution
5. **Report:** Document what was fixed

### Best Practices

- Fix one category of issues per iteration when possible
- Run analysis again after each fix to catch cascading issues
- Prefer automated fixes over manual changes
- Don't defer issues to future milestones unless blocked by external factors

## For Tool-Specific Details

See tool-specific configuration in `.github/instructions/`:
- **Codacy:** [codacy.instructions.md](../../.github/instructions/codacy.instructions.md)
- **Snyk:** [snyk_rules.instructions.md](../../.github/instructions/snyk_rules.instructions.md)
- **Markdown:** [markdown.instructions.md](../../.github/instructions/markdown.instructions.md)

Tool configurations reference these standards for behavioral guidelines.
