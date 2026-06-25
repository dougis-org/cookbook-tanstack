---
schema: 1
id: n015-development-workflow
kind: domain
title: "Development Workflow"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T22:59:01.286Z
updated_at: 2026-06-25T22:59:01.286Z
---

# Development Workflow

**Testing & TDD:** All code changes follow TDD (write tests first). See [AGENTS.md](./AGENTS.md) for full testing strategy:
- Vitest + React Testing Library for unit/integration tests
- Playwright for E2E and UI interaction tests
- Test coverage requirements and best practices

**Security:** GitHub instructions (`.github/instructions/`) configure Codacy and Snyk MCP integrations. Run security scans on new code when tools available.

**Markdown:** When editing `.md` files, use `fix_markdown` then `lint_markdown` tools if available.

**Pull Requests & Auto-Merge:** Enable auto-merge on PRs — merges once quality gates pass and comments addressed. See [CI/CD Workflow Standards](./docs/standards/ci-cd.md).

_Seeded from CLAUDE.md. Edit or archive if outdated._
