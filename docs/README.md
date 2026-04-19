# CookBook Documentation

Comprehensive documentation for the CookBook project, including standards, database schema, and project planning.

## Core Standards

**[Repository Standards](./standards/)** — Centralized guidelines for development, testing, analysis, and security

- [Code Quality](./standards/code-quality.md) — TDD workflow, testing strategy, coverage requirements
- [Analysis & Security](./standards/analysis-and-security.md) — When to run analysis, security scanning, remediation
- [Tooling](./standards/tooling.md) — Working with analysis tools, error handling, graceful fallbacks
- [CI/CD Workflow](./standards/ci-cd.md) — Local vs CI/CD validation, merge readiness

These standards are referenced by:

- `.github/instructions/` — Tool-specific configurations
- `AGENTS.md` — Agent development workflow
- `CLAUDE.md` — Architecture and conventions

## Database

- **[Database Schema](./database.md)** — MongoDB/Mongoose schema documentation,
  collections, relationships, and migration notes

## Project Planning

- **[Migration Plan](./plan/MIGRATION_PLAN.md)** — Overall migration roadmap from Laravel to TanStack Start
- **[Milestones](./plan/milestones/)** — Detailed specifications for each development milestone (1-12)
- **[User Tier Feature Sets](./user-tier-feature-sets.md)** — Product feature matrix
  and limits for Home Cook, Prep Cook, Sous Chef, and Executive Chef tiers

## Tool Configuration

- **[Codacy Configuration](./CODACY_CONFIG.md)** — Code quality analysis settings
- See `.github/instructions/` for tool-specific integration guides

## How to Use This Documentation

**For development tasks:** Start with [Repository Standards](./standards/README.md)
for behavioral guidelines, then reference tool-specific configs in
`.github/instructions/`

**For architecture questions:** See `CLAUDE.md` and `AGENTS.md` in the project root

**For schema/database questions:** See [Database Schema](./database.md)

**For planning/milestones:** See [Migration Plan](./plan/MIGRATION_PLAN.md) and milestone specifications
