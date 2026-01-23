#!/usr/bin/env python3
"""
Script to create GitHub issues from milestone task files.
Usage: GITHUB_TOKEN=your_token python3 create-milestone-issues.py MILESTONE-01.md
"""

import os
import sys
import re
import json
import time
import requests
from pathlib import Path

REPO_OWNER = "dougis-org"
REPO_NAME = "cookbook-tanstack"
API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues"

def get_github_token():
    """Get GitHub token from environment."""
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("Error: GITHUB_TOKEN environment variable is not set")
        print("Please set it with: export GITHUB_TOKEN=your_github_personal_access_token")
        sys.exit(1)
    return token

def extract_tasks_from_markdown(filepath):
    """Extract numbered tasks from a milestone markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract milestone name and number
    milestone_match = re.search(r'# Milestone (\d+):', content)
    if not milestone_match:
        print(f"Error: Could not find milestone number in {filepath}")
        sys.exit(1)

    milestone_num = milestone_match.group(1)

    # Find all sections (## x.x Section Name)
    section_pattern = r'## (\d+\.\d+) (.+?)(?=\n### Tasks|\n##|\Z)'
    sections = re.findall(section_pattern, content, re.DOTALL)

    tasks = []
    current_section = None
    current_section_name = None

    # Split content into lines for processing
    lines = content.split('\n')

    for i, line in enumerate(lines):
        # Check if this is a section header
        section_match = re.match(r'## (\d+\.\d+) (.+)', line)
        if section_match:
            current_section = section_match.group(1)
            current_section_name = section_match.group(2)
            continue

        # Check if this is a numbered task
        task_match = re.match(r'^(\d+)\. \[ \] (.+)', line)
        if task_match and current_section:
            task_num = task_match.group(1)
            task_title = task_match.group(2)

            # Collect task body (lines after the task until next task or empty line)
            task_body_lines = []
            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                # Stop if we hit another task, section, or acceptance criteria
                if (re.match(r'^\d+\. \[ \]', next_line) or
                    re.match(r'^##+ ', next_line) or
                    re.match(r'^### Acceptance', next_line) or
                    next_line.strip() == ''):
                    break
                task_body_lines.append(next_line)
                j += 1

            task_body = '\n'.join(task_body_lines).strip()

            # Determine labels based on section and content
            labels = [f"milestone-{milestone_num.zfill(2)}"]

            # Add section-based labels
            if 'setup' in current_section_name.lower() or 'configuration' in current_section_name.lower():
                labels.append("setup")
            if 'database' in current_section_name.lower() or 'schema' in current_section_name.lower():
                labels.append("database")
            if 'auth' in current_section_name.lower():
                labels.append("auth")
            if 'api' in current_section_name.lower() or 'trpc' in current_section_name.lower():
                labels.append("api")

            # Add content-based labels
            task_lower = task_title.lower() + task_body.lower()
            if 'test' in task_lower:
                labels.append("testing")
            if 'migration' in task_lower:
                labels.append("migration")
            if 'frontend' in task_lower or 'component' in task_lower or 'ui' in task_lower:
                labels.append("frontend")
            if 'config' in task_lower or 'environment' in task_lower:
                labels.append("config")

            # Remove duplicates
            labels = list(set(labels))

            tasks.append({
                'number': int(task_num),
                'title': task_title,
                'section': f"{current_section} {current_section_name}",
                'labels': labels,
                'body': task_body,
                'milestone_num': milestone_num
            })

    return tasks

def create_github_issue(token, task):
    """Create a GitHub issue for a task."""
    issue_title = f"M{task['milestone_num'].zfill(2)}-T{str(task['number']).zfill(3)}: {task['title']}"

    issue_body = f"{task['body']}\n\n" if task['body'] else ""
    issue_body += f"**Milestone:** {task['milestone_num'].zfill(2)}\n"
    issue_body += f"**Section:** {task['section']}\n"
    issue_body += f"**Task:** {task['number']}"

    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    data = {
        'title': issue_title,
        'body': issue_body,
        'labels': task['labels']
    }

    print(f"Creating issue {task['number']}: {task['title'][:60]}...")

    response = requests.post(API_URL, headers=headers, json=data)

    if response.status_code == 201:
        issue_url = response.json().get('html_url')
        print(f"  ✓ Created: {issue_url}")
        return True
    else:
        print(f"  ✗ Error: {response.status_code} - {response.text}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: GITHUB_TOKEN=your_token python3 create-milestone-issues.py <milestone-file.md>")
        print("Example: GITHUB_TOKEN=xxx python3 create-milestone-issues.py ../docs/plan/milestones/MILESTONE-01.md")
        sys.exit(1)

    milestone_file = Path(sys.argv[1])
    if not milestone_file.exists():
        print(f"Error: File not found: {milestone_file}")
        sys.exit(1)

    token = get_github_token()

    print(f"Extracting tasks from {milestone_file}...")
    tasks = extract_tasks_from_markdown(milestone_file)
    print(f"Found {len(tasks)} tasks\n")

    if len(tasks) == 0:
        print("No tasks found in the file.")
        sys.exit(1)

    # Confirm before creating issues
    response = input(f"Create {len(tasks)} GitHub issues? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Aborted.")
        sys.exit(0)

    created = 0
    failed = 0

    for task in tasks:
        if create_github_issue(token, task):
            created += 1
        else:
            failed += 1

        # Rate limiting: wait 1 second between requests
        time.sleep(1)

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total tasks: {len(tasks)}")
    print(f"  Created: {created}")
    print(f"  Failed: {failed}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
