# Test Suite: sync-agent-templates Prompt

## Overview
This document specifies the test cases for the `sync-agent-templates` prompt. Tests are organized by category and use the data provider at `.github/prompts/test-data/sync-scenarios.json` for parameterization.

## Test Data Provider
**File:** `.github/prompts/test-data/sync-scenarios.json`

Contains 4 parameterized scenarios:
- `clean-repo-all-new-files`: No conflicts; all files auto-copied
- `partial-overlap-one-conflict`: Mixed auto-copy and one conflict
- `full-conflict-all-exist`: All files conflict; user must choose strategy
- `deep-nested-structure`: Deep directory nesting with mixed outcomes

---

## Test Categories

### 1. Acquire/Clone Phase Tests

#### Test 1.1: Clone creates temp directory with timestamp
**ID:** `test_clone_creates_temp_directory`
**Input:** Execute prompt in clean repository
**Expected:**
- Temporary directory created under the OS temp directory (for example, `<os-temp>/agent-templates-<YYYYMMDDHHmmss>`)
- Directory contains cloned agent-templates repository
- Timestamp suffix ensures uniqueness (no collision)
**Assertion:** Resolved temp path (from OS/tooling) exists and contains `.github/` directory
**Status:** 🔴 RED (not yet implemented)

#### Test 1.2: Clone fails gracefully on network error
**ID:** `test_clone_network_error_handling`
**Input:** Simulate network failure during clone
**Expected:**
- Error message: "Failed to clone agent-templates: [reason]"
- User offered retry option
- Temporary directory cleaned up even on failure
**Assertion:** Cleanup completes; no temp artifacts remain
**Status:** 🔴 RED

---

### 2. Discovery Phase Tests

#### Test 2.1: Discover enumerates all .github files
**ID:** `test_discover_github_folder_contents`
**Input:** Template repository with known `.github` structure
**Expected:**
- All files in `.github/` directory tree enumerated
- Excludes `.git/`, `.gitignore`, binary files
- Returns list: `[{filePath, existsInTemplate: true}]`
**Assertion:** File count matches expected; all paths relative to `.github/`
**Scenario:** `clean-repo-all-new-files` (3 files expected)
**Status:** 🔴 RED

#### Test 2.2: Discover handles empty .github folder
**ID:** `test_discover_empty_github_folder`
**Input:** Repository with empty `.github/` directory
**Expected:**
- No error; returns empty manifest
- User informed: "No files found to sync"
**Assertion:** Graceful handling; manifest is empty array
**Status:** 🔴 RED

---

### 3. Categorization Tests

#### Test 3.1: Categorize files as auto-copy vs conflict
**ID:** `test_categorize_files_auto_copy_vs_conflict`
**Input:** Manifest from discovery phase with known base repo files
**Expected:**
- Files NOT in base repo: `status = 'auto-copy'`
- Files in base repo: `status = 'conflict'`
- Summary: "Found X new files, Y conflicts"
**Assertions:**
- Auto-copy count matches expected
- Conflict count matches expected
**Scenario:** `partial-overlap-one-conflict` (2 auto-copy, 1 conflict)
**Status:** 🔴 RED

#### Test 3.2: Categorize with full conflict
**ID:** `test_categorize_full_conflict`
**Input:** All template files exist in base repo
**Expected:**
- All files: `status = 'conflict'`
- Auto-copy count: 0
- Conflict count: 3
**Scenario:** `full-conflict-all-exist`
**Status:** 🔴 RED

---

### 4. Auto-Copy Phase Tests

#### Test 4.1: Auto-copy writes new files to base repo
**ID:** `test_auto_copy_writes_new_files`
**Input:** Scenario with 3 new files (no conflicts)
**Expected:**
- Each file read from temp clone
- Directory structure created in base repo `.github/`
- File written with identical content
- Summary: "Copied 3 files successfully"
**Assertion:** File count in base repo `.github/` increased by 3; content matches template
**Scenario:** `clean-repo-all-new-files`
**Status:** 🔴 RED

#### Test 4.2: Auto-copy handles directory creation
**ID:** `test_auto_copy_creates_nested_directories`
**Input:** Files in nested directories (e.g., `.github/prompts/nested/file.md`)
**Expected:**
- Intermediate directories created as needed
- File written to correct nested path
**Assertion:** All intermediate directories created; file exists at correct path
**Scenario:** `deep-nested-structure`
**Status:** 🔴 RED

#### Test 4.3: Auto-copy skips existing files
**ID:** `test_auto_copy_does_not_overwrite`
**Input:** File marked as 'conflict' (exists in both repos)
**Expected:**
- File NOT copied during auto-copy phase
- File remains in conflict list for later resolution
**Assertion:** Conflicting file unchanged after auto-copy phase
**Status:** 🔴 RED

---

### 5. Conflict Resolution UI Tests

#### Test 5.1: User confirmation required before conflict resolution
**ID:** `test_user_confirmation_required_for_conflicts`
**Input:** Prompt execution with conflicts present
**Expected:**
- User presented with conflict file list
- Three options displayed: [1] Overwrite all, [2] Overwrite no files, [3] Merge
- Prompt awaits user input (1, 2, or 3)
- No file operations until user confirms
**Assertion:** User input captured; decision logged
**Status:** 🔴 RED

#### Test 5.2: List conflicts clearly
**ID:** `test_conflict_listing_is_clear`
**Input:** 3 conflicting files
**Expected:**
- Each file listed with path and metadata (optional: last modified date)
- User can easily identify which files will be affected
**Assertion:** File list is human-readable and complete
**Scenario:** `full-conflict-all-exist`
**Status:** 🔴 RED

---

### 6. Execution Strategy Tests

#### Test 6.1: Overwrite all replaces existing files
**ID:** `test_overwrite_all_replaces_existing_files`
**Input:** User selects option [1] with 3 conflicting files
**Expected:**
- Each conflicting file read from template
- Each file in base repo overwritten with template version
- Summary: "Overwrote 3 files"
**Assertion:** Base repo files contain template content
**Status:** 🔴 RED

#### Test 6.2: Overwrite no files preserves base versions
**ID:** `test_overwrite_none_preserves_base_files`
**Input:** User selects option [2] with 3 conflicting files
**Expected:**
- No files written
- All conflicting files remain unchanged in base repo
- Summary: "No changes made to existing files"
**Assertion:** Base repo files unchanged; content matches original
**Status:** 🔴 RED

#### Test 6.3: Merge strategy prioritizes template
**ID:** `test_merge_strategy_prioritizes_template`
**Input:** User selects option [3]; simple merge case (no complex conflicts)
**Expected:**
- For first conflict file:
  - Side-by-side comparison shown to user
  - Proposed merged output displayed (template-priority)
  - User asked: "Accept this merge? (y/n)"
  - If yes: merged version written
  - If no: base version preserved
**Assertion:** Merged output prioritizes template content
**Status:** 🔴 RED

#### Test 6.4: Merge shows diff for each file
**ID:** `test_merge_diff_preview_per_file`
**Input:** User selects merge with 2 conflicting files
**Expected:**
- For each file:
  - Base version shown (left side)
  - Template version shown (right side)
  - Merged output preview shown
  - User can accept/reject
- After all files: summary of merge outcomes
**Assertion:** User sees clear diff; can make informed decision per file
**Status:** 🔴 RED

#### Test 6.5: Merge with complex conflicts handled
**ID:** `test_merge_complex_conflicts_require_user_decision`
**Input:** File with substantial differences (not simple additions)
**Expected:**
- Proposed merge shown
- User can review and approve
- If merge logic insufficient: user offered option to keep base or use template
**Assertion:** User control maintained; no silent overwrites
**Status:** 🔴 RED

---

### 7. Cleanup Phase Tests

#### Test 7.1: Cleanup removes temp directory
**ID:** `test_cleanup_removes_temp_folder`
**Input:** Successful sync execution
**Expected:**
- Temporary clone directory removed recursively
- Verification: temp path does not exist
- Summary: "Cleanup complete. Temporary files removed."
**Assertion:** Using MCP file operations, list the parent temp directory and assert that the temporary clone directory path is absent (does not exist) after cleanup.
**Status:** 🔴 RED

#### Test 7.2: Cleanup on error
**ID:** `test_cleanup_on_error_removes_temp`
**Input:** Sync execution aborted mid-process
**Expected:**
- Even if sync fails, cleanup is called
- Temporary directory removed
- User notified of cleanup completion
**Assertion:** Temp directory removed despite error; no artifacts remain
**Status:** 🔴 RED

#### Test 7.3: No artifacts after cleanup
**ID:** `test_no_artifacts_after_cleanup`
**Input:** Complete sync execution (clean-repo scenario)
**Expected:**
- All temp files removed
- Only changes to base repo `.github/` remain
- Base repository is sole artifact
**Assertion:** Temp directory and all intermediate files gone
**Status:** 🔴 RED

---

### 8. Error Handling & Edge Cases

#### Test 8.1: Permission denied on write
**ID:** `test_permission_denied_write_error`
**Input:** Base repo has read-only `.github/` directory
**Expected:**
- Error: "Permission denied: Cannot write to <path>"
- User offered remediation: "Check permissions and retry"
- Cleanup still runs
**Assertion:** Error message clear; cleanup completes
**Status:** 🔴 RED

#### Test 8.2: Invalid repository path
**ID:** `test_invalid_repo_path_fails_gracefully`
**Input:** Execute prompt outside a Git repository
**Expected:**
- Error: "Not a valid Git repository or no .git directory found"
- User guided to run from repository root
- Cleanup completes
**Assertion:** Graceful error; no corruption of working directory
**Status:** 🔴 RED

#### Test 8.3: Large file handling
**ID:** `test_large_files_copy_successfully`
**Input:** `.github/` contains large binary or text files (>50MB)
**Expected:**
- Files copied successfully (with progress indicator if possible)
- No corruption or truncation
- Execution time remains acceptable (<30 seconds)
**Assertion:** File checksums match after copy
**Status:** 🔴 RED

#### Test 8.4: Special characters in filenames
**ID:** `test_special_characters_in_filenames`
**Input:** Files with spaces, unicode, or special chars in names
**Expected:**
- Files copied successfully
- Filenames preserved exactly
- No encoding issues
**Assertion:** Copied files have identical names and content
**Status:** 🔴 RED

---

### 9. Manual QA Checklist

#### Manual Test 9.1: Clean repository flow
- [ ] Run prompt in repository with no `.github/` folder
- [ ] Verify all files copied automatically
- [ ] Verify cleanup removes temp directory
- [ ] Verify `.github/` structure matches template

#### Manual Test 9.2: Existing .github flow
- [ ] Run prompt in repository with existing `.github/` folder
- [ ] Verify conflicts detected correctly
- [ ] Test all three user options (overwrite all/none/merge)
- [ ] Verify temp directory cleaned up

#### Manual Test 9.3: Merge option
- [ ] Select merge option
- [ ] Verify side-by-side diff shown per file
- [ ] Approve some files, reject others
- [ ] Verify outcomes respected (approved files updated, rejected preserved)

#### Manual Test 9.4: Cross-platform
- [ ] Execute on Linux/WSL
- [ ] Execute on macOS (if available)
- [ ] Execute on Windows (if available)
- [ ] Verify path separators handled correctly
- [ ] Verify temp directory created in platform-correct location

#### Manual Test 9.5: Error recovery
- [ ] Attempt sync to read-only directory
- [ ] Verify error message clear
- [ ] Verify cleanup runs despite error
- [ ] Fix permissions and retry
- [ ] Verify retry succeeds

#### Manual Test 9.6: Abort during execution
- [ ] Start sync execution
- [ ] Abort mid-way (Ctrl+C)
- [ ] Verify cleanup still runs
- [ ] Verify temp directory removed

---

## Test Execution Strategy

### Pre-Implementation (Phase 2: RED)
1. Create this test file as specification
2. Create test data provider (`sync-scenarios.json`)
3. Verify all tests are marked 🔴 RED
4. No implementation yet; tests fail or are not runnable

### During Implementation (Phase 3: GREEN)
1. For each test category (Acquire, Discover, Categorize, etc.):
   - Implement prompt phase
   - Run relevant tests
   - Verify tests transition from 🔴 RED to 🟢 GREEN
2. Iterate until all tests pass

### Post-Implementation (Phase 3: Refactor)
1. Run full test suite
2. Identify and eliminate code duplication
3. Simplify complex sections
4. Re-run tests to confirm no regression

### Quality Gate (Phase 5)
1. Run all tests on main branch code
2. Run Markdownlint on prompt and test files
3. Verify test coverage for all ACs
4. Document test results in PR

---

## Test Result Summary Template

| Test ID | Category | Scenario | Status | Notes |
|---------|----------|----------|--------|-------|
| 1.1 | Acquire | Clone temp dir | 🔴 RED | Temp dir not yet created |
| 1.2 | Acquire | Network error | 🔴 RED | Error handling not yet implemented |
| 2.1 | Discovery | Enumerate files | 🔴 RED | File listing not yet implemented |
| 2.2 | Discovery | Empty folder | 🔴 RED | Edge case handling pending |
| 3.1 | Categorize | Auto vs conflict | 🔴 RED | Categorization logic pending |
| 3.2 | Categorize | Full conflict | 🔴 RED | Categorization logic pending |
| 4.1 | Auto-Copy | Write new files | 🔴 RED | Write logic pending |
| 4.2 | Auto-Copy | Create dirs | 🔴 RED | Directory creation pending |
| 4.3 | Auto-Copy | Skip existing | 🔴 RED | Skip logic pending |
| 5.1 | Conflict UI | User confirm | 🔴 RED | User input pending |
| 5.2 | Conflict UI | List conflicts | 🔴 RED | Listing logic pending |
| 6.1 | Execute | Overwrite all | 🔴 RED | Execution logic pending |
| 6.2 | Execute | Overwrite none | 🔴 RED | Execution logic pending |
| 6.3 | Execute | Merge strategy | 🔴 RED | Merge logic pending |
| 6.4 | Execute | Diff preview | 🔴 RED | Diff display pending |
| 6.5 | Execute | Complex merges | 🔴 RED | Complex merge handling pending |
| 7.1 | Cleanup | Remove temp | 🔴 RED | Cleanup logic pending |
| 7.2 | Cleanup | Error cleanup | 🔴 RED | Error handling cleanup pending |
| 7.3 | Cleanup | No artifacts | 🔴 RED | Artifact verification pending |
| 8.1 | Error | Permission denied | 🔴 RED | Permission error handling pending |
| 8.2 | Error | Invalid repo | 🔴 RED | Repo validation pending |
| 8.3 | Error | Large files | 🔴 RED | Large file handling pending |
| 8.4 | Error | Special chars | 🔴 RED | Filename handling pending |

---

## Coverage Analysis

**Requirements Traceability:**

| Requirement # | Description | Test(s) | Coverage |
|---------------|-------------|---------|----------|
| 1 | Standalone prompt file exists | N/A | File creation in Phase 3 |
| 2 | Acquire .github contents | 1.1, 1.2 | Clone, error handling |
| 3 | Detect & categorize files | 3.1, 3.2 | Auto-copy vs conflict |
| 4 | Auto-copy new files | 4.1, 4.2, 4.3 | Write, directories, skip |
| 5 | User confirmation required | 5.1, 5.2 | User input, listing |
| 6 | Three conflict options | 6.1, 6.2, 6.3 | Overwrite all/none/merge |
| 7 | Show merge comparison | 6.4, 6.5 | Diff, complex cases |
| 8 | Clean up artifacts | 7.1, 7.2, 7.3 | Success/error cleanup |
| 9 | No artifacts remain | 7.3, 9.6 | Verification tests |

All 9 requirements covered by corresponding tests.

---

## Next Steps

1. ✅ Create this test file (Phase 2)
2. ⏭️ Implement prompt file (Phase 3)
3. ⏭️ Run tests after implementation
4. ⏭️ Verify all tests transition to 🟢 GREEN
5. ⏭️ Document results in Phase 9 handoff
