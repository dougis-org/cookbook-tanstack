## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED fly.toml health check sends explicit Host header

The system SHALL configure the fly.io health check to send `Host: recipe.dougis.com` so it exercises the real domain path and does not rely on fly's internal machine address as the Host.

#### Scenario: Health check uses correct Host header

- **Given** `fly.toml` `[[http_service.checks]]` includes `[http_service.checks.headers]` with `Host = "recipe.dougis.com"`
- **When** fly deploys and machines start
- **Then** health check requests arrive at the app with `Host: recipe.dougis.com` and receive HTTP 2xx

#### Scenario: Machine health checks pass after deploy

- **Given** both fixes are deployed
- **When** `fly machines list --app cookbook-tanstack` is run
- **Then** both machines show `1/1` checks passing

## MODIFIED Requirements

### Requirement: MODIFIED App is reachable on both domains after deploy

The system SHALL serve responses (not 503) on both `https://recipe.dougis.com` and `https://cookbook-tanstack.fly.dev` after the fix is deployed.

#### Scenario: recipe.dougis.com serves content

- **Given** the fix is deployed and machines are healthy
- **When** `curl -sI https://recipe.dougis.com/` is run
- **Then** response status is 2xx (not 503)

#### Scenario: fly.dev domain redirects (not 503)

- **Given** the fix is deployed and machines are healthy
- **When** `curl -sI https://cookbook-tanstack.fly.dev/` is run
- **Then** response status is 301 with `Location: https://recipe.dougis.com/` (not 503)

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "fly.toml health check Host header" → Requirement ADDED fly.toml health check sends explicit Host header
- Design decision 2 (belt-and-suspenders fly.toml) → Requirement ADDED fly.toml health check
- Requirement ADDED + MODIFIED → Task: update `fly.toml` `[[http_service.checks]]` stanza
- Requirement MODIFIED (app reachable) → post-deploy verification step in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Single fix is sufficient if the other is unavailable

- **Given** only one of the two fixes is applied (code OR fly.toml)
- **When** machines start and health checks run
- **Then** health checks pass (`1/1`) and app serves traffic — each fix independently resolves the outage
