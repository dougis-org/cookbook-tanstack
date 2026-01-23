# GitHub Issues Creation Scripts

This directory contains scripts to automatically create GitHub issues from milestone task files.

## Prerequisites

1. **GitHub Personal Access Token**: You need a GitHub personal access token with `repo` scope.
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" (classic)
   - Select scope: `repo` (full control of private repositories)
   - Generate and copy the token

2. **Python 3** with `requests` library:
   ```bash
   pip3 install requests
   ```

## Usage

### Method 1: Python Script (Recommended)

This script automatically extracts all numbered tasks from any milestone file and creates GitHub issues.

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_personal_access_token_here

# Run the script with the milestone file
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-01.md
```

**Features:**
- Automatically extracts all numbered tasks from the markdown file
- Creates issues with format: `M01-T001: Task Title`
- Adds appropriate labels based on section and content
- Shows progress and summary
- Rate-limited to avoid API throttling (1 second between requests)

### Method 2: Bash Script (Manual approach)

The bash script contains hardcoded issues for the first 51 tasks of Milestone 01.

```bash
export GITHUB_TOKEN=your_github_personal_access_token_here
./create-milestone-01-issues.sh
```

## Creating Issues for All Milestones

To create issues for all milestones, run the Python script for each milestone file:

```bash
export GITHUB_TOKEN=your_token

# Milestone 01 (124 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-01.md

# Milestone 02 (349 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-02.md

# Milestone 03 (142 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-03.md

# Milestone 04 (233 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-04.md

# Milestone 05 (171 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-05.md

# Milestone 06 (195 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-06.md

# Milestone 07 (155 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-07.md

# Milestone 08 (156 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-08.md

# Milestone 09 (127 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-09.md

# Milestone 10 (106 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-10.md

# Milestone 11 (61 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-11.md

# Milestone 12 (87 tasks)
python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-12.md
```

## Issue Format

Each issue will be created with:

**Title:** `M01-T001: Task Title`
- `M01` = Milestone number
- `T001` = Task number (zero-padded)
- Task Title = The actual task description

**Body:**
- Task details (if any from the markdown)
- Milestone number
- Section name
- Task number

**Labels:**
- `milestone-XX` (e.g., `milestone-01`)
- Section-based labels (`setup`, `database`, `auth`, `api`, etc.)
- Content-based labels (`testing`, `frontend`, `config`, etc.)

## Example Output

```
Creating issue 1: Install Drizzle ORM packages...
  ✓ Created: https://github.com/dougis-org/cookbook-tanstack/issues/123

Creating issue 2: Create .env.example file...
  ✓ Created: https://github.com/dougis-org/cookbook-tanstack/issues/124

...

============================================================
Summary:
  Total tasks: 124
  Created: 124
  Failed: 0
============================================================
```

## Notes

- The script waits 1 second between each issue creation to avoid GitHub API rate limiting
- For Milestone 01 alone (124 tasks), the script will take approximately 2-3 minutes to complete
- All tasks from the milestone files have been numbered sequentially for easy tracking
- Issues can be filtered in GitHub by labels like `milestone-01`, `database`, `auth`, etc.

## Troubleshooting

**"requests" module not found:**
```bash
pip3 install requests
```

**Authentication failed:**
- Verify your GITHUB_TOKEN is correct
- Ensure the token has `repo` scope
- Check the token hasn't expired

**Rate limit exceeded:**
- The script includes 1-second delays between requests
- If you still hit limits, wait an hour and resume
- Consider increasing the `time.sleep()` value in the script

## Total Task Count by Milestone

- Milestone 01: 124 tasks
- Milestone 02: 349 tasks
- Milestone 03: 142 tasks
- Milestone 04: 233 tasks
- Milestone 05: 171 tasks
- Milestone 06: 195 tasks
- Milestone 07: 155 tasks
- Milestone 08: 156 tasks
- Milestone 09: 127 tasks
- Milestone 10: 106 tasks
- Milestone 11: 61 tasks
- Milestone 12: 87 tasks

**Total: 1,906 tasks** across all milestones!
