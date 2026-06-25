---
schema: 1
id: n012-commands
kind: domain
title: "Commands"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T22:59:01.286Z
updated_at: 2026-06-25T22:59:01.286Z
---

# Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build

# Testing (see AGENTS.md for detailed testing strategy)
npm run test         # Run unit & integration tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npx vitest run src/path/to/file.test.ts     # Run single Vitest file
npx playwright test --headed                 # Run E2E tests with browser visible

# Database commands (requires Docker: docker compose up -d, or set MONGODB_URI to Atlas)
npm run db:connect   # Verify MongoDB connection is reachable
npm run db:seed      # Seed taxonomy data (meals, courses, preparations) — idempotent
```

_Seeded from CLAUDE.md. Edit or archive if outdated._
