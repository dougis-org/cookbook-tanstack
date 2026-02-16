# Tooling Standards

## Tool Unavailability & Fallback Strategy

### Graceful Handling

When analysis or security tools are unavailable or fail:

- **Bypass gracefully** — do not halt progress
- **Defer to CI/CD** — local analysis is supplementary, not a blocking gate
- **Continue the task** — CI/CD will validate before merging
- **Document** — note tool failure for future troubleshooting

### Error Recovery Steps

If a tool fails or is unavailable:

1. **MCP Server Issues:**
   - Try resetting the MCP on the extension
   - For VSCode, review Copilot > MCP settings:
     - Personal: https://github.com/settings/copilot/features
     - Organization: https://github.com/organizations/{org-name}/settings/copilot/features

2. **CLI Not Installed:**
   - Use the tool via MCP Server instead of manual installation
   - Do not manually install CLI tools (brew/npm/npx)
   - Tool will handle initialization via MCP

3. **Generic Failure:**
   - Proceed with task; CI/CD will catch issues at merge time
   - Create issue if tool consistently fails

## Tool-Specific Handling

### Repository Registration (Codacy)

**404 Error on Repository Parameter:**
- The repository may not be registered in Codacy
- Offer to run the repository setup tool
- Only run if user accepts (never automatic)
- After setup, retry the failed action (max one retry)

### File Path Standards

- Always use standard file system paths (non-URL-encoded)
- When tools require paths, use format: `/path/to/file.ts`
- Avoid URL encoding unless tool explicitly requires it
- Git parameters should only be sent for git repositories

## Working with Multiple Tools

### Tool Orchestration

When multiple tools are available:
- Run tools in parallel when independent
- Sequential execution for dependent checks (e.g., fix issues then re-scan)
- Each tool is responsible for its own scope (security, linting, quality)

### Prioritization

If multiple tools report issues:

1. **Security** (Snyk, Trivy) — highest priority, block further work
2. **Functionality** (Codacy, Linters) — medium priority, fix before merge
3. **Style/Preferences** — lowest priority, nice-to-have

### Result Interpretation

- Treat tool output as suggestions, not gospel
- Use human judgment to validate fixes
- Test changes to ensure fixes don't introduce regressions
- Question results that seem incorrect

## MCP Server vs CLI

### When to Use MCP Server (Recommended)
- No local installation required
- Seamlessly integrated with agent workflows
- Easier error handling and status reporting
- Supported in VSCode Copilot and Claude Code

### When to Use CLI
- Only if MCP Server unavailable
- For advanced features not exposed via MCP
- In CI/CD pipelines (use tool-specific runners)

**Do NOT:**
- Require CLI installation for local agent work
- Install tools globally without user consent
- Use terminal commands as primary integration path

## Tool Configuration

### Configuration Files

Configuration patterns:
- `.tool-config.yml` or `.tool-config.json` — tool-specific settings
- `tsconfig.json` — TypeScript settings (affects multiple tools)
- `.eslintrc.js` — linting rules
- `.prettierrc` — formatting rules
- Checked into version control for consistency

### Updating Tool Settings

When modifying tool configuration:
- Update relevant config file(s)
- Document changes in PR description
- Re-run analysis to verify new settings work
- Get approval from team for significant changes

## Troubleshooting Guide

| Symptom | Likely Cause | Solution |
|---------|---|----------|
| Tool returns 404 on repo | Repository not registered | Run setup tool, retry once |
| MCP fails intermittently | Connection or server issue | Reset MCP, check network |
| Tool hung/no response | Tool crash or timeout | Kill process, try again |
| "CLI not found" error | Using CLI instead of MCP | Switch to MCP Server |
| Tool reports false positives | Configuration mismatch | Review tool config file |
| Too many issues to fix | Scope creep | Focus on current task, defer others |

## Best Practices

- Prefer MCP Server tools over CLI installation
- Run one tool category at a time (security → quality → style)
- Document tool limitations and false positives
- Keep tool configurations in version control
- Report persistent tool issues to support channels
