---
name: "Orchestrate Ticket Workflow"
description: "Execute complete ticket workflow with quality gates and human checkpoints"
mode: "orchestrator"
---

# Orchestrate Ticket Workflow

**Goal:** Execute the complete ticket workflow (TICKET_FLOW.md) by delegating to sub-agents, enforcing quality gates, and pausing at human review checkpoints.

---

## Inputs

**Required:**
- `TICKET_ID`: GitHub issue number (e.g., `#7`) or Jira ticket key (e.g., `PROJ-123`)

**Optional:**
- `MAX_RETRIES`: Max retries per phase before escalation (default: 2)
- `RESUME_FROM_PHASE`: Resume from saved workflow state at specified phase (e.g., `IMPLEMENTATION`)

---

## Phase 0: Initialization & Ticket Detection

### 0.1 Ticket Detection

Apply ticket detection logic from `.github/prompts/includes/ticket-detection.md`:

1. **Parse input**:
   - GitHub format: `#\d+` (e.g., `#7`) → platform="github"
   - Jira format: `[A-Z]+-\d+` (e.g., `PROJ-123`) → platform="jira"
   - If ambiguous, ask user for clarification

2. **Attempt fetch from platform**:
   - GitHub: Use `mcp_gh-issues_issue_read` with method="get"
   - Jira: Attempt fetch via API (if available)
   - If fetch succeeds, establish PLATFORM and TICKET_ID context
   - If fetch fails, try fallback platform; if both fail, ask user to verify ID

3. **Cache ticket data** for use throughout workflow

### 0.2 Load or Initialize State

Check for existing state file at `docs/plan/tickets/{TICKET_ID}-orchestrator-state.json`:

- **If resume requested:** Load state, validate, display current status, ask user if they want to continue from saved phase
- **If state file exists but no resume requested:** Ask user if they want to resume or start fresh
- **If state file doesn't exist:** Initialize new state (per orchestrator-state-management.md)
  ```json
  {
    "ticketId": "...",
    "platform": "...",
    "currentPhase": "DISCOVERY",
    "planFilePath": null,
    "prUrl": null,
    "checkpoints": { "planApproved": false, "prApproved": false },
    "retryCount": {},
    "maxRetries": 2,
    "phaseHistory": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```

### 0.3 Confirm Workflow Start

Present to user:

```
=== ORCHESTRATOR WORKFLOW ===

Ticket: [TICKET_ID] [TITLE]
URL: [TICKET_URL]
Platform: [PLATFORM]
Workflow: Complete ticket lifecycle (discovery → done)
Max Retries: [MAX_RETRIES]

Ready to begin?
(Type 'yes' to start, or 'details' for more info)
```

---

## Phase 1: DISCOVERY → PLANNING

### Phase 1.1: DISCOVERY

Update state: `currentPhase = "DISCOVERY"`

Actions:
1. Fetch full ticket context (title, description, labels, etc.)
2. Identify any blocking questions or ambiguities
3. Prepare context for `plan-ticket` sub-agent
4. Append to phase history:
   ```json
   {
     "phase": "DISCOVERY",
     "status": "completed",
     "summary": "Ticket #7 loaded from GitHub",
     "artifacts": ["TICKET_ID", "TICKET_TITLE", "TICKET_DESCRIPTION"]
   }
   ```

### Phase 1.2: PLANNING

Transition to `PLANNING` phase. Invoke `plan-ticket` sub-agent using the .github/agents/plan-ticket.agent.md mode and the .github/prompts/plan-ticket.prompt.md prompt file for instructions:

```
Subagent Task: Create implementation plan for [TICKET_ID]

Ticket Context:
- Title: [TICKET_TITLE]
- Description: [TICKET_DESCRIPTION]
- URL: [TICKET_URL]

Requirements:
1. Create detailed plan at docs/plan/tickets/[TICKET_ID]-plan.md
2. Plan must include all 11 required sections (per plan schema)
3. ACs should be normalized and unambiguous
4. Identify any blockers or require clarification upfront

Sub-Agent Mode: plan-ticket
Expected Output: Success summary with plan file path, sections count, risk summary
```

After sub-agent completes:

1. **Validate output:**
   - Check plan file exists at specified path
   - Parse file; verify all 11 sections present
   - If validation fails, retry (up to `maxRetries`)

2. **Update state:**
   - `currentPhase = "ANALYSIS"`
   - Record plan file path in state
   - Append to phase history with artifacts

---

## Phase 2: ANALYSIS → PLAN_CHECKPOINT

### Phase 2.1: ANALYSIS

Invoke `analyze-ticket` sub-agent:

```
Subagent Task: Analyze plan for [TICKET_ID]

Plan File: docs/plan/tickets/[TICKET_ID]-plan.md
Ticket: [TICKET_URL]

Requirements:
1. Validate plan completeness (all 11 sections present)
2. Assess risks (Section 6) for severity and mitigation gaps
3. Evaluate decomposition recommendation (Section 4)
4. Identify any cross-dependencies or integration concerns
5. Provide analysis summary for checkpoint presentation

Sub-Agent Mode: .github/agents/plan-ticket.agent.md
Sub-Agent Prompt: .github/prompts/analyze-ticket.prompt.md
Expected Output: Success summary with risk assessment, decomposition recommendation, any concerns, any discovered issues corrected
```

After sub-agent completes:

1. **Validate output:** Analysis completed successfully
2. **Update state:** `currentPhase = "ANALYSIS"` → `"PLAN_CHECKPOINT"`
3. **Append to phase history** with analysis summary

### Phase 2.2: PLAN_CHECKPOINT (Human Review #1)

Present checkpoint to user (per human-checkpoint-protocol.md):

```
=== PLAN CHECKPOINT ===

Ready for human review of implementation plan.

---
PLAN SUMMARY:
[Sections 1-4 from plan file]

---
RISK ASSESSMENT:
[Section 6 from plan - risks & mitigations]

---
DECOMPOSITION RECOMMENDATION:
[Section 4 recommendation; note if single-ticket vs multi-ticket]

---
Questions/Details Available:
- Review full plan: docs/plan/tickets/[TICKET_ID]-plan.md
- Discuss specific areas with this agent

---
DECISION REQUIRED:

Approve plan and proceed to implementation? (yes/no/details)
```

**Handle User Response:**

#### Approval Response (yes, approve, proceed)

1. Set `checkpoints.planApproved = true`
2. Update state: `currentPhase = "IMPLEMENTATION"`
3. Log approval to GitHub issue (comment with approval timestamp)
4. Continue to next phase

#### Rejection Response (no, reject, feedback)

1. Extract user feedback
2. Route to appropriate sub-agent:
   - **Scope/Requirements feedback** → `plan-ticket` (re-plan)
   - **Risk/Mitigation feedback** → `analyze-ticket` (re-analyze)
   - **Decomposition feedback** → `plan-ticket` (re-scope)
   - **Ambiguous** → Ask user which agent to target

3. Invoke sub-agent with custom prompt:
   ```
   User Feedback on Plan:
   "[USER_FEEDBACK]"
   
   Please address these concerns and revise the plan. After remediation,
   the plan will be presented for re-approval.
   ```

4. After sub-agent completes, return to PLAN_CHECKPOINT and re-present

#### Request for Details (details, more info, questions)

1. Answer user questions or clarifications
2. Offer to show full plan file, risk details, etc.
3. Return to checkpoint when user ready

---

## Phase 3: IMPLEMENTATION → PR_CREATION

### Phase 3.1: IMPLEMENTATION

Transition to `IMPLEMENTATION`. Invoke `work-ticket` sub-agent:

```
Subagent Task: Implement [TICKET_ID] per approved plan

Plan File: docs/plan/tickets/[TICKET_ID]-plan.md
Plan Approval: CONFIRMED
Ticket: [TICKET_URL]

Requirements:
1. Implement per plan ACs and approach (Section 3-4)
2. Write TDD tests first (RED → GREEN → REFACTOR)
3. All tests pass; all quality gates pass (linting, coverage, complexity)
4. Feature flags (if applicable) documented and default OFF
5. Commit with signed conventional commit message
6. Ready for PR creation

Sub-Agent Mode: work-ticket
Expected Output: Success summary with file list, test count, quality gate status, branch name
```

After sub-agent completes:

1. **Validate output:**
   - Verify tests pass
   - Verify build succeeds
   - Verify linters pass
   - If validation fails, retry sub-agent (up to `maxRetries`)

2. **Update state:**
   - `currentPhase = "LOCAL_REVIEW"`
   - Record branch name in state

### Phase 3.2: LOCAL_REVIEW

Invoke `review-ticket-work` sub-agent:

```
Subagent Task: Self-review implementation for [TICKET_ID]

Branch: [BRANCH_NAME]
Plan: docs/plan/tickets/[TICKET_ID]-plan.md

Requirements:
1. Review code for quality, maintainability, clarity
2. Verify all ACs covered by tests
3. Check for code duplication, complexity issues
4. Confirm documentation updated
5. Provide summary; flag any concerns for remediation

Sub-Agent Mode: review-ticket-work
Expected Output: Success summary with review results, any issues to address before PR
```

After sub-agent completes:

1. **Validate output:** Self-review completed
2. **Update state:** `currentPhase = "PR_CREATION"`
3. **Append to phase history**

### Phase 3.3: PR_CREATION

Invoke `cut-pr` sub-agent:

```
Subagent Task: Create pull request for [TICKET_ID]

Branch: [BRANCH_NAME]
Ticket: [TICKET_URL]
Plan: docs/plan/tickets/[TICKET_ID]-plan.md

Requirements:
1. Create PR with descriptive title (feat/fix/chore: [TICKET_ID] summary)
2. Include plan link and AC coverage in description
3. Include test summary and quality gate status
4. Request reviewers from CODEOWNERS
5. Return PR URL and number

Sub-Agent Mode: cut-pr
Expected Output: PR URL, PR number, summary of PR details
```

After sub-agent completes:

1. **Validate output:**
   - PR URL valid (GitHub API returns 200)
   - PR includes required fields (description, reviewers requested)
   - If validation fails, retry or investigate

2. **Update state:**
   - `prUrl = "[PR_URL]"`
   - `currentPhase = "PR_CHECKPOINT"`
   - Record PR URL in phase history

---

## Phase 4: PR_CHECKPOINT (Human Review #2)

Present PR checkpoint to user (per human-checkpoint-protocol.md):

```
=== PR CHECKPOINT ===

Ready for human review of implementation pull request.

---
PULL REQUEST DETAILS:
Title: [PR_TITLE]
URL: [PR_URL]
Commits: [COMMIT_COUNT]
Files Changed: [FILE_COUNT]

---
ACCEPTANCE CRITERIA COVERAGE:
✅ AC#1: [AC_1_TITLE]
   Test: [TEST_REFERENCE]
   Status: PASS
...
[All 16 ACs listed with coverage status]

Coverage: [N]/[TOTAL] (verified by tests)

---
TEST RESULTS SUMMARY:
Unit Tests: PASS ([COUNT] tests)
Integration Tests: PASS ([COUNT] tests)
Total Coverage: [PERCENTAGE]%

---
QUALITY GATE STATUS:
Build: ✅ PASS
Linting: ✅ PASS
Duplication: ✅ OK
Complexity: ✅ OK
Documentation: ✅ Updated

---
Questions/Details Available:
- Review PR diffs: [PR_URL]
- Review test results: docs/plan/tickets/[TICKET_ID]-test-results.md
- Discuss specific changes with this agent

---
DECISION REQUIRED:

Approve PR for merge? (yes/no/details)
```

**Handle User Response:**

#### Approval Response (yes, approve, merge)

1. Set `checkpoints.prApproved = true`
2. Update state: `currentPhase = "CODE_REVIEW"`
3. Log approval to GitHub PR (comment with approval timestamp)
4. Continue to next phase

#### Rejection Response (no, reject, feedback)

1. Extract user feedback
2. Route to appropriate sub-agent:
   - **Code/Test feedback** → `work-ticket` (fix implementation)
   - **PR format/description feedback** → `cut-pr` (update PR)
   - **Code review/quality feedback** → `review-pr` (address)
   - **Ambiguous** → Ask user which agent to target

3. Invoke sub-agent with custom prompt including feedback
4. Sub-agent addresses issues (code changes, new tests, PR update, etc.)
5. After remediation:
   - If code changed, cycle back to PR_CREATION (new PR)
   - If only PR updated, return to PR_CHECKPOINT
6. Re-present checkpoint

#### Request for Details (details, more info, questions)

1. Answer user questions about implementation, tests, changes
2. Link to test files, PR diffs, change summary
3. Return to checkpoint when user ready

---

## Phase 5: CODE_REVIEW → DONE

### Phase 5.1: CODE_REVIEW

Invoke `review-pr` sub-agent:

```
Subagent Task: Finalize code review and merge for [TICKET_ID]

PR: [PR_URL]
Ticket: [TICKET_URL]

Requirements:
1. Conduct final code review against CONTRIBUTING.md standards
2. Verify all CI/CD checks pass
3. Ensure PR ready for merge (all conversations resolved)
4. Merge PR using appropriate strategy (squash or merge commit)
5. Verify post-merge CI/CD pipeline succeeds on main branch
6. Provide merge confirmation and summary

Sub-Agent Mode: review-pr
Expected Output: Merge confirmation, merged commit SHA, post-merge verification status
```

After sub-agent completes:

1. **Validate output:**
   - PR merged to main (GitHub API confirms merge status)
   - Post-merge CI/CD pipeline green
   - If merge failed, investigate and retry or escalate

2. **Update state:**
   - `currentPhase = "DONE"`
   - Record merged commit SHA
   - Append to phase history with merge confirmation

### Phase 5.2: DONE

Generate final workflow summary:

```
=== ORCHESTRATOR WORKFLOW COMPLETE ===

Ticket #[TICKET_ID]: [TICKET_TITLE] ✅ DONE

Timeline:
- Started: [START_TIMESTAMP]
- Completed: [END_TIMESTAMP]
- Total Duration: [DURATION]

Workflow Phases:
1. ✅ DISCOVERY ([TIME]) - Ticket loaded
2. ✅ PLANNING ([TIME]) - Plan created
3. ✅ ANALYSIS ([TIME]) - Risk & decomposition analysis
4. ✅ PLAN_CHECKPOINT - Approved
5. ✅ IMPLEMENTATION ([TIME], [RETRIES] retries) - Code & tests
6. ✅ LOCAL_REVIEW ([TIME]) - Self-review
7. ✅ PR_CREATION ([TIME]) - PR created
8. ✅ PR_CHECKPOINT - Approved
9. ✅ CODE_REVIEW ([TIME]) - Final review & merge
10. ✅ DONE - Workflow complete

Deliverables:
- Plan: docs/plan/tickets/[TICKET_ID]-plan.md
- PR: [PR_URL] (merged to main)
- Files Changed: [COUNT] files
- New Tests: [COUNT] tests
- Quality Gates: All passing

Checkpoints:
- Plan Approval: ✅ Approved [TIMESTAMP]
- PR Approval: ✅ Approved [TIMESTAMP]

Sub-Agent Summary:
- plan-ticket: [TIME], [STATUS]
- analyze-ticket: [TIME], [STATUS]
- work-ticket: [TIME], [STATUS] ([RETRIES] retries)
- review-ticket-work: [TIME], [STATUS]
- cut-pr: [TIME], [STATUS]
- review-pr: [TIME], [STATUS]

Full State & History: docs/plan/tickets/[TICKET_ID]-orchestrator-state.json

Next Steps:
- ✅ PR merged to main
- ✅ CI/CD pipeline green
- Monitor for any deployment or post-merge issues
- Close GitHub issue when ready
```

Update GitHub issue with completion comment:

```
## Workflow Complete ✅

Orchestrator workflow for #[TICKET_ID] completed successfully.

**Summary:**
- Plan approved at PLAN_CHECKPOINT
- Implementation completed with [N] retries
- PR #[PR_NUMBER] approved and merged to main

**Deliverables:**
- Orchestrator agent: .github/agents/ticket-orchestrator.agent.md
- Orchestrator prompt: .github/prompts/orchestrate-ticket.prompt.md
- Include files: orchestrator-state-management.md, human-checkpoint-protocol.md
- Test suite: .github/prompts/__tests__/orchestrate-ticket.test.md
- Test data: .github/prompts/test-data/orchestrator-scenarios.json
- Documentation: README, TICKET_FLOW updated

**Quality:**
- All 16 ACs satisfied
- All tests passing (50+ tests)
- All quality gates passing
- Zero blocking issues

See full state: docs/plan/tickets/[TICKET_ID]-orchestrator-state.json
```

---

## Error Handling & Recovery

### Sub-Agent Failure

If sub-agent returns status="failure":

1. Log error with phase context
2. Increment `retryCount[phase]`
3. If `retryCount[phase] < maxRetries`:
   - Re-invoke sub-agent (up to maxRetries attempts)
4. If `retryCount[phase] >= maxRetries`:
   - Escalate to human:
     ```
     Sub-Agent Failure (Max Retries Exceeded)
     
     Phase: [PHASE]
     Sub-Agent: [AGENT_NAME]
     Attempts: [MAX_RETRIES]/[MAX_RETRIES]
     Error: [ERROR_MESSAGE]
     
     Options:
     1. Reset and retry from [PHASE]
     2. Adjust plan/input and retry
     3. Abort workflow and preserve state
     ```
   - Wait for user decision before proceeding

### Sub-Agent Timeout

If sub-agent times out:

1. Log timeout with phase and elapsed time
2. Increment `retryCount[phase]`
3. Same retry logic as failure

### Invalid Ticket ID

If ticket ID cannot be parsed:

1. Error: "Invalid ticket ID format"
2. Provide examples: "Use #7 for GitHub or PROJ-123 for Jira"
3. Ask user to provide corrected ID
4. Restart initialization

### Ticket Not Found

If ticket fetch returns 404:

1. Error: "Ticket not found"
2. Verify ticket exists at URL
3. Ask user to confirm ticket ID and retry

### State File Corruption

If state file is invalid JSON:

1. Error: "State file corrupted"
2. Create backup: `.backup-{TICKET_ID}-orchestrator-state.json`
3. Offer user options:
   - Reset state and restart
   - Manually specify recovery phase
   - Abort and inspect backup

---

## State File Management

### Persistence

State file persisted at: `docs/plan/tickets/{TICKET_ID}-orchestrator-state.json`

Write pattern (atomic):
1. Serialize state to JSON
2. Write to temporary file
3. Validate temporary file
4. Rename to permanent (atomic operation)
5. Update `updatedAt` timestamp

### Resumption

On workflow restart:

1. Check for existing state file
2. If found, offer user option to resume or start fresh
3. If user resumes, load state and continue from `currentPhase`
4. Display current status and prior outputs before continuing

### State Visibility

User can request state display at any time:

- `show state` → Display current phase, progress, checkpoints, history
- `review phase [PHASE_NAME]` → Display outputs from specific phase
- `review history` → Display full phase history with timestamps and artifacts

---

## Quality Gates

Before advancing to next phase, orchestrator MUST verify:

| Phase | Gate | Validation |
|-------|------|-----------|
| PLANNING | Plan file exists | Check file at specified path |
| PLANNING | Plan completeness | All 11 sections present |
| IMPLEMENTATION | Tests pass | `npm test` succeeds |
| IMPLEMENTATION | Build succeeds | No compile/lint errors |
| PR_CREATION | PR exists | GitHub API confirms PR |
| PR_CREATION | PR has description | Required fields present |
| CODE_REVIEW | All CI/CD green | Status checks all pass |
| CODE_REVIEW | PR merged | GitHub API confirms merge |

If any gate fails:
1. Log failure with details
2. Retry sub-agent (up to maxRetries)
3. If retries exhausted, escalate to human

---

## Success Criteria

Workflow reaches DONE phase when:

- ✅ Plan approved at PLAN_CHECKPOINT
- ✅ Implementation completed (all tests pass, all gates pass)
- ✅ PR approved at PR_CHECKPOINT
- ✅ PR merged to main
- ✅ Post-merge CI/CD pipeline green
- ✅ All 16 ACs satisfied (or deviations documented)
- ✅ State file persisted with full history

---

## References

- **Workflow:** [TICKET_FLOW.md](../../TICKET_FLOW.md)
- **State Management:** [orchestrator-state-management.md](../agents/includes/orchestrator-state-management.md)
- **Checkpoint Protocol:** [human-checkpoint-protocol.md](../agents/includes/human-checkpoint-protocol.md)
- **Plan Schema:** [plan-file-structure.schema.json](./includes/plan-file-structure.schema.json)
- **Ticket Detection:** [ticket-detection.md](./includes/ticket-detection.md)
- **Test Suite:** [orchestrate-ticket.test.md](./__tests__/orchestrate-ticket.test.md)
- **Test Data:** [orchestrator-scenarios.json](./test-data/orchestrator-scenarios.json)

