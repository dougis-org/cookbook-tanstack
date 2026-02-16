# Archived: Includes Directory

The contents of this directory have been centralized and moved to a more discoverable location.

## Migration Index

| Old File | New Location |
|----------|--------------|
| `local-analysis-pattern.md` | `docs/standards/analysis-and-security.md#local-code-analysis` |
| `tool-unavailability-handling.md` | `docs/standards/tooling.md#tool-unavailability--fallback-strategy` |
| `codacy-scan-reference.md` | `docs/standards/analysis-and-security.md#security-scanning` + `.github/instructions/codacy.instructions.md` |

## New Structure

All repository-wide standards are now in **`docs/standards/`**:
- `docs/standards/code-quality.md` — Testing, TDD, code style
- `docs/standards/analysis-and-security.md` — Analysis workflow, security scanning
- `docs/standards/tooling.md` — Tool error handling, best practices
- `docs/standards/ci-cd.md` — CI/CD workflow, merge readiness

Tool-specific configurations reference these standards:
- `.github/instructions/codacy.instructions.md`
- `.github/instructions/snyk_rules.instructions.md`
- `.github/instructions/markdown.instructions.md`

## Why This Change

Centralizing standards in `docs/standards/` makes them:
- **Discoverable** — Located with other documentation
- **Reusable** — Can be referenced by any tool or agent system
- **Maintainable** — Single source of truth for each standard
- **Versionable** — Part of project history and PR reviews

See `docs/standards/README.md` for the full index and quick reference.
