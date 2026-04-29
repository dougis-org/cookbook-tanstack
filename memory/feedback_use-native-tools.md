---
name: feedback_use-native-tools
description: Use native Read/Edit tools instead of Bash sed/cat for file reading and editing
type: feedback
---

Use the native Read and Edit tools for file reading and editing — not Bash sed/cat/awk.

**Why:** User explicitly requested this for a better experience.

**How to apply:** When exploring or editing file contents, use Read (not `cat`/`sed -n`) and Edit (not `sed`). Bash is fine for grep/find pattern matching only.
