---
schema: 1
id: n011-quick-setup
kind: domain
title: "Quick Setup"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T22:59:01.286Z
updated_at: 2026-06-25T22:59:01.286Z
---

# Quick Setup

1. **Install dependencies:** `npm install`
2. **Start MongoDB:** `docker compose up -d` (starts MongoDB 7)
3. **Create environment file:** Copy `.env.example` to `.env.local`, adjust if needed
4. **Seed database:** `npm run db:seed`
5. **Start dev server:** `npm run dev` — app runs on http://localhost:3000

_Seeded from CLAUDE.md. Edit or archive if outdated._
