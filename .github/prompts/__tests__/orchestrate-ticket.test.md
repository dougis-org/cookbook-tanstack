# Orchestrator Agent Test Suite

## Overview

Comprehensive test suite for the orchestrator agent, covering happy paths, edge cases, error conditions, and state management. All tests are parameterized using `.github/prompts/test-data/orchestrator-scenarios.json`.

---

## Test Categories

### Category 1: Happy Path Tests

#### Test 1.1: GitHub Issue Initialization
- **Source:** `orchestrator-scenarios.json#happy-path[0]`
- **Setup:** Provide GitHub issue number `#7`
- **Expected:**
  - Orchestrator initializes state with `platform = "github"`
  - `currentPhase = "DISCOVERY"`
  - `ticketId = "#7"`
  - State file created at `docs/plan/tickets/7-orchestrator-state.json`
- **Assertions:**
  - State file exists and is valid JSON
  - All required state fields populated
  - No errors logged

#### Test 1.2: Jira Ticket Initialization
- **Source:** `orchestrator-scenarios.json#happy-path[1]`
- **Setup:** Provide Jira ticket key `PROJ-123`
- **Expected:**
  - Orchestrator initializes state with `platform = "jira"`
  - `currentPhase = "DISCOVERY"`
  - `ticketId = "PROJ-123"`
- **Assertions:**
  - State file exists with correct ticket ID
  - Platform detected correctly

#### Test 1.3: Complete Workflow to DONE
- **Source:** `orchestrator-scenarios.json#happy-path[0]`
- **Setup:** Run full orchestrator workflow with approvals at both checkpoints
- **Actions:**
  1. Initialize with `#7`
  2. Execute phases in order: DISCOVERY → PLANNING → ANALYSIS
  3. Approve at PLAN_CHECKPOINT
  4. Continue: IMPLEMENTATION → LOCAL_REVIEW → PR_CREATION
  5. Approve at PR_CHECKPOINT
  6. Complete: CODE_REVIEW → DONE
- **Expected:**
  - All phases execute in sequence
  - State transitions correctly at each phase
  - Final phase reaches DONE
  - Workflow summary generated with file list, test counts, quality gates
- **Assertions:**
  - `currentPhase = "DONE"`
  - All phase history entries present and timestamped
  - PR URL persisted in state
  - Summary contains key artifacts

---

### Category 2: Edge Case Tests

#### Test 2.1: Plan Rejection with Scope Feedback
- **Source:** `orchestrator-scenarios.json#edge-cases[0]`
- **Setup:** Execute workflow up to PLAN_CHECKPOINT, then reject with feedback
- **Action:** User rejects plan with message: "Scope too large, AC #5 overlaps with existing feature"
- **Expected:**
  - Orchestrator routes to `plan-ticket` sub-agent
  - Sub-agent receives custom prompt with user feedback
  - After remediation, returns to PLAN_CHECKPOINT
  - User can approve revised plan
- **Assertions:**
  - `expectedRouting = "plan-ticket"` matches feedback keywords
  - Sub-agent invoked with feedback context
  - State marks previous attempt in history
  - Phase can be re-executed without full restart

#### Test 2.2: PR Rejection with Quality Feedback
- **Source:** `orchestrator-scenarios.json#edge-cases[1]`
- **Setup:** Execute workflow to PR_CHECKPOINT, then reject with quality feedback
- **Action:** User rejects PR with message: "Code coverage dropped 5% below baseline. Add unit tests for error paths."
- **Expected:**
  - Orchestrator routes to `work-ticket` sub-agent
  - Sub-agent receives feedback about test coverage
  - After work-ticket completes, returns to PR_CHECKPOINT
  - New PR created with improved tests
- **Assertions:**
  - `expectedRouting = "work-ticket"` (quality/code issue)
  - PR URL updates in state after second cut
  - Coverage metrics improve on re-review

#### Test 2.3: Sub-Agent Failure Triggers Retry
- **Source:** `orchestrator-scenarios.json#edge-cases[2]`
- **Setup:** Mock plan-ticket to fail on first attempt, succeed on second
- **Expected:**
  - Orchestrator detects failure (status: "failure")
  - Automatically retries (attempt 1/2)
  - Second attempt succeeds
  - Workflow continues to next phase
- **Assertions:**
  - `retryCount["PLANNING"] = 2`
  - Both attempts logged in phase history
  - Workflow does not skip to error handling
  - Max retries not exceeded

#### Test 2.4: Max Retries Exceeded Escalates
- **Source:** `orchestrator-scenarios.json#edge-cases[3]`
- **Setup:** Mock work-ticket to fail on both attempts
- **Expected:**
  - Orchestrator retries twice (max retries = 2)
  - After second failure, escalates to human
  - Presents error context and manual recovery options
- **Assertions:**
  - `retryCount["IMPLEMENTATION"] = 2`
  - `expectedEscalation = true`
  - Error message includes sub-agent logs
  - User offered options: reset state, adjust plan, abandon ticket

---

### Category 3: Error Case Tests

#### Test 3.1: Invalid Ticket ID Format
- **Source:** `orchestrator-scenarios.json#error-cases[0]`
- **Setup:** Provide ticket ID with invalid format: `"invalid-ticket"`
- **Expected:**
  - Orchestrator rejects input
  - Error message: "Invalid ticket ID format"
  - User prompted with valid examples: `#7` or `PROJ-123`
- **Assertions:**
  - No state file created
  - No sub-agent invoked
  - User can retry with corrected input

#### Test 3.2: Ticket Not Found
- **Source:** `orchestrator-scenarios.json#error-cases[1]`
- **Setup:** Provide valid format but non-existent ticket: `#99999`
- **Expected:**
  - Orchestrator attempts ticket lookup
  - GitHub/Jira API returns 404
  - Error message: "Ticket not found"
  - User prompted to verify and retry
- **Assertions:**
  - API call logged
  - User can provide different ticket ID
  - No partial state left behind

#### Test 3.3: Sub-Agent Timeout
- **Source:** `orchestrator-scenarios.json#error-cases[2]`
- **Setup:** Mock sub-agent to timeout during ANALYSIS phase
- **Expected:**
  - Orchestrator detects timeout (status: "timeout")
  - Automatically retries (attempt 1/2)
  - If second attempt also times out, escalates
- **Assertions:**
  - Retry count incremented
  - Timeout logged with phase context
  - User notified after max retries

#### Test 3.4: State File Corruption
- **Source:** `orchestrator-scenarios.json#error-cases[3]`
- **Setup:** Manually corrupt state file with invalid JSON
- **Expected:**
  - Orchestrator detects corruption on load
  - Error message: "State file corrupted"
  - User offered options: reset, recover, or abort
- **Assertions:**
  - Backup of corrupted file created
  - Recovery options presented
  - No data loss beyond corrupted session

---

### Category 4: Checkpoint Tests

#### Test 4.1: Plan Checkpoint Presentation
- **Source:** `orchestrator-scenarios.json#checkpoints[0]`
- **Setup:** Reach PLAN_CHECKPOINT after PLANNING and ANALYSIS phases
- **Expected Presentation:**
  - **Plan Summary:** Sections 1-4 from plan file
  - **Risk Assessment:** Section 6 from plan
  - **Decomposition Recommendation:** Section 4 (if applicable)
  - **Explicit Approval Request:** "Approve plan and proceed to implementation? (yes/no/details)"
- **Assertions:**
  - All required fields present
  - Plan file parsed correctly
  - User can inspect full plan file before deciding
  - Approval/rejection handled correctly

#### Test 4.2: PR Checkpoint Presentation
- **Source:** `orchestrator-scenarios.json#checkpoints[1]`
- **Setup:** Reach PR_CHECKPOINT after PR_CREATION phase
- **Expected Presentation:**
  - **PR URL & Title:** Direct link to GitHub PR
  - **AC Coverage Summary:** List of acceptance criteria with test coverage
  - **Test Results Summary:** Unit tests passed/failed, integration tests, contract tests
  - **Quality Gate Status:** Lint status, coverage %, complexity checks
  - **Explicit Approval Request:** "Approve PR for merge? (yes/no/details)"
- **Assertions:**
  - PR link valid and clickable
  - AC coverage complete or deviations documented
  - All quality gates visible
  - User can request more details before deciding

---

### Category 5: Feedback Routing Tests

#### Test 5.1: Route Planning Feedback to plan-ticket
- **Source:** `orchestrator-scenarios.json#feedback-routing[0]`
- **Setup:** Reject at PLAN_CHECKPOINT with feedback: "Scope too large, need to decompose further"
- **Expected:**
  - Orchestrator analyzes keywords: ["scope", "decompose", "large"]
  - Routes to `plan-ticket` sub-agent
  - Sub-agent receives custom prompt: "User feedback on plan: Scope too large, need to decompose further. Please revise the plan to address these concerns."
- **Assertions:**
  - Keyword matching works correctly
  - Feedback incorporated into sub-agent prompt
  - Sub-agent can be re-invoked without full reset

#### Test 5.2: Route Implementation Feedback to work-ticket
- **Source:** `orchestrator-scenarios.json#feedback-routing[1]`
- **Setup:** Reject at PR_CHECKPOINT with feedback: "Code coverage dropped 5%. Add tests for error paths."
- **Expected:**
  - Keywords: ["coverage", "tests", "quality"]
  - Routes to `work-ticket` sub-agent
  - Sub-agent receives feedback about tests and coverage
- **Assertions:**
  - Implementation quality issues route correctly
  - work-ticket can address test coverage gaps
  - PR can be re-cut after work-ticket completes

#### Test 5.3: Route PR Feedback to cut-pr
- **Source:** `orchestrator-scenarios.json#feedback-routing[2]`
- **Setup:** Reject at PR_CHECKPOINT with feedback: "PR description missing rollback steps"
- **Expected:**
  - Keywords: ["description", "rollback", "pr"]
  - Routes to `cut-pr` sub-agent
  - Sub-agent updates PR description
- **Assertions:**
  - PR format issues route correctly
  - cut-pr can update existing PR without re-creating

---

### Category 6: State Tracking Tests

#### Test 6.1: Initialize State Correctly
- **Source:** `orchestrator-scenarios.json#state-tracking[0]`
- **Setup:** Start orchestrator with `#7` and `maxRetries = 2`
- **Expected State:**
  ```json
  {
    "ticketId": "#7",
    "platform": "github",
    "currentPhase": "DISCOVERY",
    "checkpoints": { "planApproved": false, "prApproved": false },
    "retryCount": {},
    "maxRetries": 2,
    "phaseHistory": []
  }
  ```
- **Assertions:**
  - All fields initialized
  - No null/undefined values
  - Ready for first phase execution

#### Test 6.2: Phase Transitions Update State
- **Source:** `orchestrator-scenarios.json#state-tracking[1]`
- **Setup:** Execute phases DISCOVERY → PLANNING → ANALYSIS
- **Expected:**
  - Each transition updates `currentPhase`
  - Each completed phase appended to `phaseHistory`
  - Phase history entries include `startedAt`, `completedAt`, `status`, `summary`
- **Assertions:**
  - `currentPhase` matches expected next phase after each transition
  - Phase history length increments correctly
  - All timestamps are valid ISO 8601 format

#### Test 6.3: Checkpoint Approval Updates State
- **Source:** `orchestrator-scenarios.json#state-tracking[2]`
- **Setup:** Approve at PLAN_CHECKPOINT
- **Expected:**
  - `checkpoints.planApproved` set to `true`
  - `currentPhase` advances to "IMPLEMENTATION"
  - Approval timestamp recorded
- **Assertions:**
  - Checkpoint flag persisted
  - State file updated atomically
  - No data loss during write

#### Test 6.4: Resume from Saved Phase
- **Source:** `orchestrator-scenarios.json#state-tracking[3]`
- **Setup:** 
  1. Run workflow to IMPLEMENTATION phase
  2. Stop (simulate session interrupt)
  3. Restart with resume option
- **Expected:**
  - Orchestrator loads state from `7-orchestrator-state.json`
  - `currentPhase` set to "IMPLEMENTATION"
  - Prior phases skipped
  - Workflow continues from IMPLEMENTATION onwards
- **Assertions:**
  - State file loaded correctly
  - No re-execution of prior phases
  - Phase history preserved from previous session
  - User can inspect prior outputs (plan, PR link, etc.)

---

## Test Execution

### Prerequisites

- `.github/prompts/test-data/orchestrator-scenarios.json` exists and is valid
- Mock `runSubagent` responses configured per scenario
- GitHub/Jira API mocked or integration test against real API
- File system sandbox for state file creation

### Running Tests

#### All Tests (Parameterized)
```bash
# Load test data from orchestrator-scenarios.json
# For each scenario: initialize state, execute phases, validate outputs
```

#### Happy Path Only
```bash
# Run scenarios from happy-path section only
```

#### Error Cases Only
```bash
# Run scenarios from error-cases section only
```

#### Manual QA Checklist
- [ ] Run orchestrator with real GitHub issue #7; verify plan checkpoint
- [ ] Approve plan checkpoint; verify transition to work-ticket
- [ ] Reject plan with feedback; verify routing back to plan-ticket
- [ ] Complete full workflow through to PR approval
- [ ] Test with Jira ticket (if Jira integration available)
- [ ] Verify sub-agent retry on transient failure
- [ ] Interrupt workflow mid-phase; verify state file saved
- [ ] Resume from saved state; verify correct phase and no data loss

---

## Success Criteria

All parameterized tests PASS:
- ✅ Happy path: Both GitHub and Jira workflows complete to DONE
- ✅ Edge cases: All rerouting and retry scenarios work as expected
- ✅ Error cases: Invalid input, missing tickets, timeouts handled gracefully
- ✅ Checkpoints: Correct information presented; approval/rejection handled
- ✅ Feedback routing: Keywords map to correct sub-agents
- ✅ State tracking: State persists, resumes, and transitions correctly

Manual QA checklist fully completed before phase completion.

