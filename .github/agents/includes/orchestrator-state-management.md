# Orchestrator State Management

## State Initialization

Initialize orchestrator state when starting a new workflow.

### State Structure

```typescript
interface OrchestratorState {
  ticketId: string;              // "#7" (GitHub) or "PROJ-123" (Jira)
  platform: "github" | "jira";   // Detected from ticket ID format
  currentPhase: WorkflowPhase;    // e.g., "DISCOVERY", "PLANNING", etc.
  planFilePath?: string;         // docs/plan/tickets/7-plan.md (once created)
  prUrl?: string;                // GitHub PR URL (once created)
  checkpoints: {
    planApproved: boolean;       // True after PLAN_CHECKPOINT approval
    prApproved: boolean;         // True after PR_CHECKPOINT approval
  };
  retryCount: Record<WorkflowPhase, number>; // Track retries per phase
  maxRetries: number;            // Default 2, user-configurable
  phaseHistory: PhaseRecord[];   // Audit trail of all phases executed
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

interface PhaseRecord {
  phase: WorkflowPhase;
  startedAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp
  status: "in-progress" | "completed" | "failed";
  artifacts?: string[];          // File paths, URLs produced
  summary?: string;              // Short description of phase result
  error?: string;                // Error message if status=failed
}

type WorkflowPhase = 
  | "DISCOVERY"
  | "PLANNING"
  | "ANALYSIS"
  | "PLAN_CHECKPOINT"
  | "IMPLEMENTATION"
  | "LOCAL_REVIEW"
  | "PR_CREATION"
  | "PR_CHECKPOINT"
  | "CODE_REVIEW"
  | "DONE";
```

### Initialization Logic

1. **Parse ticket ID** using ticket detection (from `.github/prompts/includes/ticket-detection.md`)
   - GitHub format: `#\d+` → platform="github"
   - Jira format: `[A-Z]+-\d+` → platform="jira"

2. **Create initial state object**:
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
     "createdAt": "2026-01-31T04:15:00Z",
     "updatedAt": "2026-01-31T04:15:00Z"
   }
   ```

3. **Persist state file** at `docs/plan/tickets/{TICKET_ID}-orchestrator-state.json`
   - Replace leading `#` in GitHub issues: `#7` → `7`
   - Use ticket key as-is for Jira: `PROJ-123`

4. **Validate state file** on load:
   - Parse as JSON; fail fast if invalid
   - Verify required fields; add defaults if missing
   - Check for data corruption; prompt user for recovery if needed

---

## Phase Transitions

### Transition Rules

Valid transitions defined per TICKET_FLOW.md:

```
DISCOVERY → PLANNING
PLANNING → ANALYSIS
ANALYSIS → PLAN_CHECKPOINT
PLAN_CHECKPOINT → (approval: IMPLEMENTATION | rejection: PLANNING/PLAN_TICKET)
IMPLEMENTATION → LOCAL_REVIEW
LOCAL_REVIEW → PR_CREATION
PR_CREATION → PR_CHECKPOINT
PR_CHECKPOINT → (approval: CODE_REVIEW | rejection: IMPLEMENTATION/WORK_TICKET)
CODE_REVIEW → DONE
```

### Transition Logic

When advancing to next phase:

1. **Check current phase** is valid and complete
2. **Mark current phase as completed**:
   ```json
   {
     "phase": "PLANNING",
     "status": "completed",
     "completedAt": "2026-01-31T04:20:00Z",
     "summary": "Plan file created at docs/plan/tickets/7-plan.md",
     "artifacts": ["docs/plan/tickets/7-plan.md"]
   }
   ```

3. **Validate sub-agent output** for quality gates:
   - Plan phase: Check plan file exists, all 11 sections present
   - Implementation phase: Check tests pass, code builds, linters pass
   - PR phase: Check PR URL valid, tests pass, coverage maintained

4. **Update state**:
   ```json
   {
     "currentPhase": "ANALYSIS",
     "updatedAt": "2026-01-31T04:20:00Z"
   }
   ```

5. **Append to phase history** with completion details

6. **Persist state file** atomically (write to temp file, then rename)

### Rejection & Rerouting

When user rejects at checkpoint:

1. **Extract user feedback**
2. **Route to appropriate sub-agent** (see human-checkpoint-protocol.md for full routing logic):
   - **PLAN_CHECKPOINT rejections** may route to: `plan-ticket`, `analyze-ticket` (based on feedback keywords)
   - **PR_CHECKPOINT rejections** may route to: `work-ticket`, `cut-pr`, `review-pr` (based on feedback keywords)
3. **Update phase history**:
   ```json
   {
     "phase": "PLAN_CHECKPOINT",
     "status": "failed",
     "error": "User rejected: Scope too large"
   }
   ```

4. **Reset to appropriate phase** for rerouted sub-agent:
   - Feedback on scope/requirements → PLANNING phase
   - Feedback on risks/mitigations → ANALYSIS phase
   - Feedback on code/tests → IMPLEMENTATION phase
   - Feedback on PR format → PR_CREATION phase
   - (See human-checkpoint-protocol.md Feedback Routing section for complete routing table)

5. **Update state**:
   ```json
   {
     "currentPhase": "PLANNING",
     "updatedAt": "2026-01-31T04:25:00Z"
   }
   ```

6. **Persist and re-invoke sub-agent** with feedback context

---

## Retry Count Tracking

### Per-Phase Retry Logic

Maintain `retryCount[phase]` in state:

```json
{
  "retryCount": {
    "PLANNING": 2,
    "IMPLEMENTATION": 1
  }
}
```

### Retry Threshold

- Default max retries: 2 per phase
- User can override via `maxRetries` input parameter
- Special phases (checkpoints) do not consume retries (user decision)

### Retry Decision Tree

1. **Sub-agent reports status="failure"**
   - Increment `retryCount[phase]`
   - If `retryCount[phase] < maxRetries`:
     - Log retry attempt
     - Re-invoke sub-agent
   - If `retryCount[phase] >= maxRetries`:
     - Escalate to human
     - Present error context and recovery options

2. **Sub-agent reports status="timeout"**
   - Count as retry attempt
   - Same logic as failure

3. **Sub-agent reports status="blocked"**
   - Do not retry automatically
   - Escalate to human immediately

### Error Handling

For each retry attempt:

1. **Log attempt number**: "Attempt 2/2 for IMPLEMENTATION phase"
2. **Include prior error** in sub-agent prompt: "Previous attempt failed: Build timeout"
3. **Update phase history**:
   ```json
   {
     "phase": "IMPLEMENTATION",
     "status": "in-progress",
     "retryAttempt": 2,
     "priorError": "Build timeout"
   }
   ```

4. **After max retries exceeded**:
   - Set phase status to "failed"
   - Present to user with all error logs
   - Offer options: reset state, adjust input, contact support

---

## State Resumption

### Resume from Saved Phase

When user resumes interrupted workflow:

1. **Detect existing state file** at `docs/plan/tickets/{TICKET_ID}-orchestrator-state.json`

2. **Load and validate state**:
   - Parse JSON
   - Verify required fields
   - Check timestamps are valid

3. **Display current status** to user:
   ```
   === WORKFLOW STATE ===
   Ticket: #7 (GitHub)
   Current Phase: IMPLEMENTATION
   Last Updated: 2026-01-31T04:20:00Z
   
   Progress:
   ✅ DISCOVERY (completed)
   ✅ PLANNING (completed, 1 hour ago)
   ✅ ANALYSIS (completed, 30 min ago)
   ✅ PLAN_CHECKPOINT (approved, 25 min ago)
   🔄 IMPLEMENTATION (in-progress)
   
   Previous checkpoint approvals:
   - Plan: ✅ Approved
   - PR: ⏳ Pending
   ```

4. **Offer user options**:
   - `Continue` - Resume from current phase
   - `Review` - Display prior phase outputs (plan, PR link, etc.)
   - `Reset` - Start workflow over from DISCOVERY
   - `Abort` - Stop and preserve current state

5. **On continue**:
   - Skip all prior phases
   - Continue from current phase
   - Preserve phase history and artifacts

---

## State Visibility

### Display Current State

Command: `show state` or similar user request

Output:

```
=== ORCHESTRATOR STATE ===
Ticket ID: #7
Platform: GitHub
Workflow: agent-templates / orchestrator
Current Phase: ANALYSIS
Max Retries: 2

STATUS:
✅ DISCOVERY (completed 5 min ago)
✅ PLANNING (completed 3 min ago)
🔄 ANALYSIS (started 1 min ago)
⏳ PLAN_CHECKPOINT (pending)
⏹️  Remaining phases (6): IMPLEMENTATION, LOCAL_REVIEW, PR_CREATION, ...

CHECKPOINTS:
- Plan Review: ⏳ Pending (set after ANALYSIS complete)
- PR Review: ⏹️  Not reached

ARTIFACTS:
- Plan File: docs/plan/tickets/7-plan.md
- PR URL: (not yet created)

RETRY STATUS:
- DISCOVERY: 0/2 attempts
- PLANNING: 0/2 attempts
- ANALYSIS: 1/2 attempts

PHASE HISTORY:
1. DISCOVERY: completed (2026-01-31T04:15:30Z)
   Summary: Ticket #7 loaded from GitHub
   
2. PLANNING: completed (2026-01-31T04:17:45Z)
   Summary: Plan created, all 11 sections
   
3. ANALYSIS: in-progress (2026-01-31T04:19:00Z)

NEXT STEP: Awaiting ANALYSIS completion (analyze-ticket sub-agent)
```

### Review Prior Phase Outputs

User can request inspection of completed phases:

- `review plan` → Display plan file (or link)
- `review test data` → Display test scenarios used
- `review pr` → Display PR URL and details (once created)
- `review history` → Display full phase history with timestamps

---

## Persistence & Atomicity

### File Operations

State file location: `docs/plan/tickets/{TICKET_ID}-orchestrator-state.json`

Write pattern (atomic):
1. Serialize state to JSON
2. Write to temporary file: `.tmp-{TICKET_ID}-orchestrator-state.json`
3. Validate temporary file is valid JSON
4. Rename temporary to permanent (atomic rename)
5. If rename fails, delete temporary and report error

Read pattern:
1. Attempt to read permanent state file
2. If not found, return empty/uninitialized state
3. If found but invalid JSON, report corruption and offer recovery

### Backup Strategy

- Before updating state, keep backup of prior version at `.backup-{TICKET_ID}-orchestrator-state.json`
- Retain backups for 7 days (user's discretion)
- User can request rollback to specific backup

---

## Telemetry & Observability

State tracking enables post-workflow analysis:

- **Total workflow time**: `updatedAt - createdAt`
- **Phase duration**: `completedAt - startedAt` per phase
- **Retry rate**: Sum of retries per phase / total phases
- **Checkpoint approval rate**: Approvals / total checkpoints
- **Sub-agent performance**: Average phase duration by agent

Output example:

```
Workflow Summary:
- Total Time: 2 hours 15 minutes
- Phases Executed: 9 (DISCOVERY through CODE_REVIEW)
- Retries: 1 (PLANNING phase)
- Checkpoint Approvals: 2/2 (100%)
- Sub-Agent Performance:
  * plan-ticket: 25 min
  * analyze-ticket: 10 min
  * work-ticket: 1 hour 20 min
  * review-ticket-work: 5 min
  * cut-pr: 10 min
  * review-pr: 5 min
```

