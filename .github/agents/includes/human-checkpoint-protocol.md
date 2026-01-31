# Human Checkpoint Protocol

## Overview

Orchestrator pauses at two defined checkpoints to present work for human approval. User can approve to advance, reject to route feedback to appropriate sub-agent, or request more details.

---

## Checkpoint 1: Plan Checkpoint (After PLANNING + ANALYSIS)

### Timing

Triggered after both `plan-ticket` and `analyze-ticket` sub-agents complete successfully.

### Presentation Format

```
=== PLAN CHECKPOINT ===

Ready for human review of implementation plan.

---
PLAN SUMMARY:
Ticket: #7 (Orchestrator Agent)
Title: Create an orchestrator agent that coordinates the complete ticket workflow

Overview:
[Sections 1-4 from plan file - Summary, Assumptions, ACs, Approach]

---
RISK ASSESSMENT:
[Section 6 from plan - Effort, Risks, Mitigations]

Key Risks:
- runSubagent tool limitations (HIGH/MEDIUM severity)
- Sub-agent output parsing reliability (MEDIUM/MEDIUM)
- State file corruption edge case (MEDIUM/LOW)

Recommended Mitigations:
- Early validation of runSubagent delegation
- Define strict output contract with sub-agents
- Implement state file backup/recovery

---
DECOMPOSITION RECOMMENDATION:
[Section 4 from plan - Architecture, any multi-ticket guidance]

This ticket is appropriately sized as a single unit. All components are tightly coupled 
through the orchestrator state machine.

---
NEXT STEPS IF APPROVED:
1. Begin IMPLEMENTATION phase (work-ticket sub-agent)
2. Complete full workflow (work-ticket → review → cut-pr → review-pr)
3. PR review at second checkpoint (PR_CHECKPOINT)
4. Final code review and merge

---
QUESTIONS/DETAILS AVAILABLE:
- Review full plan file: docs/plan/tickets/7-plan.md
- Discuss specific ACs, risks, or approach with this agent
```

### Approval Flow

User response: `approve` | `yes` | `proceed` | similar positive signal

Actions:
1. Set `checkpoints.planApproved = true`
2. Record approval timestamp
3. Advance to next phase: `IMPLEMENTATION`
4. Invoke `work-ticket` sub-agent
5. Continue workflow

### Rejection Flow

User response: `reject` | `no` | `not ready` | feedback text

#### Rejection with Feedback

Example feedback:
```
The scope seems too large. AC #5 about feature flags overlaps with 
existing infrastructure. Should we decompose or descope this ticket?
```

Actions:
1. Parse user feedback
2. Route to appropriate sub-agent (see Feedback Routing section)
3. Reset phase to enable sub-agent rework
4. After sub-agent completes, return to PLAN_CHECKPOINT
5. Re-present checkpoint for user approval

#### Rejection Without Feedback

Example: User just says "reject"

Actions:
1. Ask clarifying question: "What specific concerns? (Plan scope, risk level, AC clarity, other?)"
2. Wait for user feedback
3. Proceed with routing once clarity obtained

---

## Checkpoint 2: PR Checkpoint (After PR_CREATION)

### Timing

Triggered after `cut-pr` sub-agent successfully creates pull request.

### Presentation Format

```
=== PR CHECKPOINT ===

Ready for human review of implementation pull request.

---
PULL REQUEST DETAILS:
Title: feat(orchestrator): #7 Orchestrator agent for ticket workflow
URL: https://github.com/dougis-org/agent-templates/pull/123
Created: 2026-01-31T04:45:00Z

Branch: feature/7-orchestrator-agent
Commits: 8
Files Changed: 12
  New: 6 files
  Modified: 6 files

---
ACCEPTANCE CRITERIA COVERAGE:
✅ AC#1: Agent file exists at .github/agents/ticket-orchestrator.agent.md
✅ AC#2: Prompt file exists at .github/prompts/orchestrate-ticket.prompt.md
✅ AC#3: Ticket platform agnostic (GitHub/Jira support)
✅ AC#4: Quality enforcement (refuses to advance on failures)
✅ AC#5: Sequential workflow execution
✅ AC#6: Sub-agent delegation via runSubagent
✅ AC#7: Human checkpoint (Plan) with required info
✅ AC#8: Human checkpoint (PR) with required info
✅ AC#9: Approval flow advances workflow
✅ AC#10: Rejection flow routes to sub-agent
✅ AC#11: Sub-agent completion expectations documented
✅ AC#12: State tracking (persistence & phases)
✅ AC#13: State visibility command
✅ AC#14: State resumption from saved phase
✅ AC#15: Stage review of prior outputs
✅ AC#16: Configurable retry count

Coverage: 16/16 (100%)

---
TEST RESULTS SUMMARY:
Unit Tests: PASS (42 tests)
  ✅ State initialization: 4 tests
  ✅ Phase transitions: 8 tests
  ✅ Checkpoint handling: 6 tests
  ✅ Feedback routing: 8 tests
  ✅ Error cases: 16 tests

Integration Tests: PASS (8 tests)
  ✅ Full workflow GitHub issue: 1 test
  ✅ Full workflow Jira ticket: 1 test
  ✅ Plan rejection + rework: 1 test
  ✅ PR rejection + rework: 1 test
  ✅ Sub-agent retry: 1 test
  ✅ State resumption: 2 tests
  ✅ Smoke tests: 1 test

Coverage: 50 tests, all PASS

---
QUALITY GATE STATUS:

Build: ✅ PASS
  - Markdownlint: ✅ PASS (0 errors)
  - Content validation: ✅ PASS
  - Syntax check: ✅ PASS

Code Quality: ✅ PASS
  - Duplication scan: ✅ No significant duplication detected
  - Complexity: ✅ All methods <10 cyclomatic complexity
  - Dead code: ✅ No unused imports or code blocks

Documentation: ✅ PASS
  - README updated: ✅ Yes
  - TICKET_FLOW updated: ✅ Yes
  - Include files documented: ✅ Yes
  - API contracts defined: ✅ Yes

Coverage:
  - Test coverage: 95% (baseline 90%)
  - All new code covered: ✅ Yes
  - No regression: ✅ Coverage improved

Schema & Artifacts:
  - Schema drift: ✅ Not applicable (no schema changes)
  - Breaking changes: ✅ None (backward compatible)

---
REVIEWERS REQUESTED:
- @dougis (author)
- @codeowners (via CODEOWNERS)

---
RISKS & MITIGATIONS:
[From plan §6]

Identified Risks:
1. runSubagent tool limitations → Mitigated by early validation tests
2. Sub-agent output parsing → Mitigated by strict output contract + error handling
3. State file corruption → Mitigated by atomic writes + backup/recovery

All mitigations implemented and tested.

---
ROLLOUT STRATEGY:
[From plan §9]

1. Merge PR to main
2. Update README documentation
3. Announce in repository discussions

---
QUESTIONS/DETAILS AVAILABLE:
- Review PR diffs: https://github.com/dougis-org/agent-templates/pull/123
- Review test results: docs/plan/tickets/7-test-results.md
- Review quality gates: Codacy PR checks (link in PR)
- Discuss specific changes, concerns, or questions with this agent
```

### Approval Flow

User response: `approve` | `yes` | `merge` | similar positive signal

Actions:
1. Set `checkpoints.prApproved = true`
2. Record approval timestamp
3. Advance to next phase: `CODE_REVIEW`
4. Invoke `review-pr` sub-agent to handle final code review and merge
5. Continue workflow to completion (CODE_REVIEW → DONE)

### Rejection Flow

User response: `reject` | `no` | `more work` | feedback text

#### Rejection with Feedback

Example feedback:
```
Coverage report shows a 2% drop in error path testing. The feedback 
routing logic needs more test cases for ambiguous keywords.
```

Actions:
1. Parse user feedback
2. Route to appropriate sub-agent (see Feedback Routing section)
3. Reset phase: `IMPLEMENTATION`
4. Sub-agent addresses feedback (e.g., `work-ticket` adds tests)
5. After sub-agent completes, cycle back to `PR_CREATION`
6. `cut-pr` creates new PR with fixes
7. Return to PR_CHECKPOINT for re-approval

#### Rejection Without Feedback

Example: User says "More work needed"

Actions:
1. Ask clarifying question: "What specifically needs work? (tests, docs, code quality, coverage, other?)"
2. Wait for detailed feedback
3. Proceed with routing once feedback obtained

---

## Feedback Routing Logic

### Routing Decision Tree

When user rejects at checkpoint with feedback:

1. **Extract feedback text**
2. **Perform keyword analysis**
   - Tokenize feedback
   - Match against routing keywords (case-insensitive)
   - Score each target sub-agent (count of matching keywords)
   - Select highest-scoring sub-agent

3. **If ambiguous (multiple high-scoring targets)**
   - Present routing options to user
   - Let user confirm which sub-agent should handle

4. **Route to selected sub-agent**
   - Generate custom prompt with feedback context
   - Invoke sub-agent
   - Mark phase for resumption after sub-agent completes

### Routing Keywords by Sub-Agent

#### plan-ticket
Handles plan/requirements/design feedback

Keywords:
- `plan`, `planning`, `requirement`, `requirements`, `ac`, `acceptance`, `criteria`, `ambiguous`, `unclear`, `scope`, `scope creep`, `decompose`, `decomposition`, `too large`, `too small`, `design`, `architecture`, `approach`, `strategy`, `timeline`, `effort`, `risk`, `assumption`, `assumption needs validation`

Example: "Plan scope too large, AC #5 overlaps with existing work"
→ Routes to `plan-ticket`

#### work-ticket
Handles implementation/code/test feedback

Keywords:
- `code`, `implementation`, `test`, `tests`, `coverage`, `quality`, `complexity`, `duplication`, `error handling`, `error path`, `edge case`, `refactor`, `simplify`, `bug`, `issue`, `build`, `build fail`, `pass`, `fail`, `unit test`, `integration test`, `performance`, `optimization`, `validation`, `input validation`

Example: "Code coverage dropped 5%, need more unit tests for error paths"
→ Routes to `work-ticket`

#### cut-pr
Handles PR/description/commit feedback

Keywords:
- `pr`, `pull request`, `description`, `commit`, `commit message`, `title`, `rollback`, `rollout`, `rollback procedure`, `documentation`, `changelog`, `readme`, `branch name`, `formatting`, `template`, `summary`

Example: "PR description missing rollback steps and deployment guide"
→ Routes to `cut-pr`

#### analyze-ticket
Handles analysis/risk/decomposition feedback (during planning phase)

Keywords:
- `analysis`, `risk`, `risk assessment`, `mitigation`, `dependency`, `dependencies`, `integration`, `compatibility`, `backward compatibility`, `migration`, `performance impact`, `security`

Example: "Risk assessment underestimates database migration complexity"
→ Routes to `analyze-ticket` (if rejection at PLAN_CHECKPOINT)

#### review-ticket-work
Handles self-review/quality feedback (during work phase)

Keywords:
- `review`, `self-review`, `quality gate`, `gate`, `linting`, `style`, `consistency`, `maintainability`, `readability`, `naming`, `documentation string`, `comment`, `doc comment`

Example: "Code lacks comments in orchestrator-state-management logic"
→ Routes to `review-ticket-work`

#### review-pr
Handles final PR review feedback (after cut-pr)

Keywords:
- `merge`, `ready`, `final review`, `ci`, `ci failed`, `ci check`, `status check`, `requirement`, `required review`

Example: "CI check failed on linting, need to fix before merge"
→ Routes to `review-pr` (which can work with work-ticket or cut-pr to remediate)

### Routing Example

User feedback at PLAN_CHECKPOINT:
```
This plan looks good but I'm concerned about the runSubagent tool 
availability. Should we have a fallback for when the tool is unavailable? 
Also, can we add more detail on the error handling approach?
```

Analysis:
- Keywords found: `plan` (1), `risk` (1), `mitigation` (1), `error handling` (1), `design` (1)
- Top scoring: `plan-ticket` (1), `analyze-ticket` (1)
- Ambiguous match

Action:
- Present routing options to user:
  ```
  Your feedback could be addressed by:
  1. plan-ticket - Revise plan scope and approach
  2. analyze-ticket - Deepen risk analysis and mitigations
  
  Which would you prefer? (1, 2, or both?)
  ```
- User selects → Invoke selected sub-agent(s)
- After remediation, return to PLAN_CHECKPOINT

---

## Checkpoint Continuation & Error Handling

### If Sub-Agent Fails After Rejection

User rejects at checkpoint → Orchestrator routes to sub-agent → Sub-agent fails

Actions:
1. Log failure with checkpoint context
2. Retry sub-agent (per retry logic in orchestrator-state-management.md)
3. After max retries, escalate to human:
   ```
   Sub-agent remediation failed:
   
   Phase: PLANNING (rework after plan rejection)
   Sub-Agent: plan-ticket
   Attempt: 2/2
   Error: Unable to parse existing plan file
   
   Options:
   1. Continue to checkpoint with existing plan (risk of re-rejection)
   2. Reset workflow from DISCOVERY
   3. Abort and preserve current state
   ```

### If User Approves Then Immediately Rejects Again

Scenario: User approves at checkpoint → Workflow proceeds → User realizes issue and contacts agent

Actions:
1. Orchestrator can accept rollback request via special command: `rollback to PLAN_CHECKPOINT`
2. Rewind state to checkpoint
3. Allow user to re-review and reject with new feedback
4. Route to appropriate sub-agent

### If Multiple Rounds of Feedback Occur

Scenario: User rejects → Rework occurs → Re-presents → User rejects again with new feedback

Behavior:
- State tracks all rejection/rework cycles in phase history
- Each rejection→rework→re-present cycle recorded as separate phase history entries
- User can review full history of feedback exchanges
- After 2-3 rejection cycles, encourage user to open discussion on ticket

---

## Checkpoint Timeout & Session Preservation

### If User Doesn't Respond at Checkpoint

Behavior:
- Orchestrator waits indefinitely for user decision
- Session state preserved
- User can resume later with `resume workflow` command
- Prior checkpoint state fully preserved

### If Session Interrupted During Checkpoint

Scenario: User is reviewing checkpoint info when session terminates

Actions:
1. State file saved with `currentPhase = PLAN_CHECKPOINT` or `PR_CHECKPOINT`
2. On resume, orchestrator loads state and re-presents checkpoint
3. User decision handling resumes as if interruption never occurred

---

## Checkpoint Output & Documentation

### Checkpoint Summary for Handoff

After approval at both checkpoints, orchestrator generates summary:

```
=== ORCHESTRATOR WORKFLOW COMPLETE ===

Ticket #7: Orchestrator Agent ✅ DONE

Timeline:
- Started: 2026-01-31T04:15:00Z
- Completed: 2026-01-31T07:30:00Z
- Total time: 3 hours 15 minutes

Workflow Phases:
1. ✅ DISCOVERY (5 min) - Ticket loaded
2. ✅ PLANNING (25 min) - Plan created with 11 sections
3. ✅ ANALYSIS (15 min) - Risk & decomposition analysis
4. ✅ PLAN_CHECKPOINT - Approved without issues
5. ✅ IMPLEMENTATION (1 hr 40 min, 1 retry) - Agent & prompt files created
6. ✅ LOCAL_REVIEW (20 min) - Quality gates validated
7. ✅ PR_CREATION (15 min) - PR #123 created
8. ✅ PR_CHECKPOINT - Approved without issues
9. ✅ CODE_REVIEW (10 min) - Final review and merge

Deliverables:
- ✅ Agent file: .github/agents/ticket-orchestrator.agent.md
- ✅ Prompt file: .github/prompts/orchestrate-ticket.prompt.md
- ✅ Include files: orchestrator-state-management.md, human-checkpoint-protocol.md
- ✅ Test suite: .github/prompts/__tests__/orchestrate-ticket.test.md
- ✅ Test data: .github/prompts/test-data/orchestrator-scenarios.json
- ✅ Documentation updates: README, TICKET_FLOW

Quality Gates:
- ✅ All tests pass (50 tests)
- ✅ Build passes (markdownlint clean)
- ✅ Code quality gates pass (no duplication, complexity OK)
- ✅ Coverage maintained (95%)
- ✅ No breaking changes

Approvals:
- ✅ Plan checkpoint: Approved
- ✅ PR checkpoint: Approved
- ✅ Code review: Approved by @codeowners
- ✅ PR merged to main

See full state and history: docs/plan/tickets/7-orchestrator-state.json
```

