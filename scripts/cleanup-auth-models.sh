#!/bin/bash
# Script to clean up redundant Mongoose auth model files
# These files are no longer needed as Better-Auth manages the auth collections

rm -f src/db/models/user.ts
rm -f src/db/models/session.ts
rm -f src/db/models/account.ts

echo "✓ Deleted redundant auth model files"
echo "✓ Verify with: git status"
