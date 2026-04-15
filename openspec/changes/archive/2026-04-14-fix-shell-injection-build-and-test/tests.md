---
name: tests
description: Tests for the shell injection fix in build-and-test.yml
---

# Tests

## Overview

This document outlines the tests for the `fix-shell-injection-build-and-test` change. Since this is a workflow change, "tests" involve verifying the YAML structure and ensuring the logic remains correct.

## Testing Steps

For each task in `tasks.md`:

1.  **Verify YAML Structure:** After modifying the workflow file, ensure it is still valid YAML and that the `env` block is correctly placed.
2.  **Verify Logic:** Ensure the environment variables are correctly mapped from the GitHub context and that the `run` script references them correctly.

## Test Cases

- [ ] **Test Case 1 for Task 3: YAML Validity**
    - Run a YAML linter or use a tool to verify `.github/workflows/build-and-test.yml` is valid.
    - Expected: No syntax errors.
- [ ] **Test Case 2 for Task 3: Secure Mapping**
    - Verify that `${{ github.head_ref }}` and `${{ github.event.pull_request.head.sha }}` are NOT directly interpolated in the `run` block.
    - Expected: Only environment variable references (e.g., `"$HEAD_REF"`) are used.
- [ ] **Test Case 3 for Task 3: Environment Variable Definition**
    - Verify that the `env:` block in the `Commit updated lock file` step correctly maps the context variables.
    - Expected: `HEAD_REF` and `HEAD_SHA` are defined.
- [ ] **Test Case 4 for Task 4: Global Hardening**
    - Perform a final `grep` across the file for `${{ github.` inside `run:` blocks.
    - Expected: No matches for potentially untrusted data.
