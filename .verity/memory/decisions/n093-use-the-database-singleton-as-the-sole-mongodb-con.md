---
schema: 1
id: n093-use-the-database-singleton-as-the-sole-mongodb-con
kind: decision
title: "Use the database singleton as the sole MongoDB connection entry point"
domains: ["database", "mongodb"]
file_globs:
  - "**/db/**"
confidence: 0.73
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "04e37461-2ab1-45f0-86de-ea4733330eff"
task: "b1709f0e-42b6-4c2f-884a-81357dc3cd30"
run: "run-20260925220431-77e05984"
created_at: 2026-09-25T22:04:36.754902+00:00
updated_at: 2026-09-25T22:04:36.659+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use the database singleton as the sole MongoDB connection entry point

Route MongoDB access through the shared database singleton rather than opening connections independently. Centralizing connection ownership avoids leaked or duplicated connections and ensures global Mongoose strict-mode configuration is applied consistently. This constrains database access code that connects to MongoDB; new repositories or services should obtain the connection through the singleton.
