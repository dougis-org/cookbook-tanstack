This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED h3 override matches npm latest

The system SHALL pin `h3` and `h3-v2` overrides in `package.json` to `2.0.1-rc.21` (npm `latest` dist-tag).

#### Scenario: h3 resolves at rc.21 after install

- **Given** `package.json` overrides are set to `h3: "2.0.1-rc.21"` and `h3-v2: "npm:h3@2.0.1-rc.21"`
- **When** `npm install` is run
- **Then** `npm ls h3` shows `h3@2.0.1-rc.21` with no unmet peer dependency warnings related to h3

#### Scenario: build succeeds with rc.21

- **Given** h3 is at rc.21
- **When** `npm run build` is run
- **Then** the build completes without errors and `.output/server/index.mjs` is generated

### Requirement: MODIFIED `webServer.timeout` is justified and documented

The Playwright `webServer.timeout` in `playwright.config.ts` SHALL be set to a value that reliably accommodates the production server's measured startup time in CI, with an inline comment explaining the rationale.

#### Scenario: health check succeeds before timeout in CI

- **Given** `webServer.timeout` is set to the chosen value (≥ 60000ms)
- **When** the CI E2E step starts the production server and Playwright polls the health check URL
- **Then** the server responds before the timeout elapses and no `WebServer timed out` error appears in the E2E step log

#### Scenario: timeout value is documented in code

- **Given** `playwright.config.ts` is reviewed
- **When** the `webServer.timeout` field is inspected
- **Then** an inline comment explains the chosen value and references the measured or estimated server startup time

## REMOVED Requirements

### Requirement: REMOVED Undocumented 60-second webServer timeout

Reason for removal: The 60-second timeout was introduced in PR #415 without documentation or measurement justification. It replaced the prior 120-second value. The new value must be backed by a measured or reasoned estimate of server startup time.

## Traceability

- Proposal element "Restore h3 to rc.21" -> Requirement: MODIFIED h3 override matches npm latest
- Proposal element "webServer timeout adjustment" -> Requirement: MODIFIED `webServer.timeout` is justified and documented
- Design decision 3 (h3 restoration) -> Requirement: MODIFIED h3 override matches npm latest
- Design decision 4 (webServer timeout) -> Requirement: MODIFIED `webServer.timeout` is justified and documented
- Requirement MODIFIED "h3 at rc.21" -> Tasks: update package.json overrides, run npm install, verify build
- Requirement MODIFIED "timeout documented" -> Tasks: update playwright.config.ts with new timeout and comment

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: package overrides are consistent with npm latest

- **Given** the fix is applied
- **When** `npm outdated` or `npm ls h3` is run
- **Then** no drift warning is shown for h3 vs. the npm `latest` dist-tag, and the Codacy check that previously flagged the inconsistency passes
