# Repository Standards

Centralized guidelines for development, code quality, testing, analysis, and security across the CookBook project. These standards are referenced by tool-specific configurations in `.github/instructions/` and should be followed by all development agents and contributors.

## Standards Index

- **[Code Quality](./code-quality.md)** — Testing strategy (TDD), coverage requirements, code review principles
- **[Analysis & Security](./analysis-and-security.md)** — When to run code analysis, security scanning, remediation workflow
- **[Tooling](./tooling.md)** — Standard practices for working with analysis tools, error handling, graceful fallbacks
- **[CI/CD Workflow](./ci-cd.md)** — Local vs CI validation, authoritative checks, merge readiness

## Quick Reference

| Need | Reference |
|------|-----------|
| Testing requirements | [Code Quality](./code-quality.md) |
| Running code analysis | [Analysis & Security](./analysis-and-security.md) |
| Tool errors/unavailability | [Tooling](./tooling.md) |
| What's authoritative for merge | [CI/CD Workflow](./ci-cd.md) |

## For Tool Maintainers

Tool-specific configurations and invocation details live in `.github/instructions/`:
- `.github/instructions/codacy.instructions.md` — Codacy integration  
- `.github/instructions/snyk_rules.instructions.md` — Snyk integration
- `.github/instructions/markdown.instructions.md` — Markdown linting

These files reference the standards here for behavioral guidelines.
