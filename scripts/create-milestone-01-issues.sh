#!/bin/bash

# Script to create GitHub issues for all Milestone 01 tasks
# Usage: GITHUB_TOKEN=your_token ./create-milestone-01-issues.sh

set -e

REPO_OWNER="dougis-org"
REPO_NAME="cookbook-tanstack"
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set"
  echo "Please set it with: export GITHUB_TOKEN=your_github_personal_access_token"
  exit 1
fi

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"

  echo "Creating issue: $title"

  curl -s -X POST "$API_URL" \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d @- << EOF
{
  "title": "$title",
  "body": "$body",
  "labels": [$labels]
}
EOF

  echo ""
  sleep 1
}

echo "Creating Milestone 01 issues..."
echo ""

# 1.1 Project Setup & Configuration (Tasks 1-11)

create_issue \
  "M01-T01: Install Drizzle ORM packages" \
  "Install drizzle-orm, postgres, and drizzle-kit packages\n\n\`\`\`bash\nnpm install drizzle-orm postgres\nnpm install -D drizzle-kit\n\`\`\`\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T02: Create .env.example file" \
  "Create \`.env.example\` file with all required database variables documented\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "config"'

create_issue \
  "M01-T03: Configure environment variables for local" \
  "Configure environment variables for local environment (\`.env.local\`)\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "config"'

create_issue \
  "M01-T04: Set up Drizzle config file" \
  "Set up Drizzle config file (\`drizzle.config.ts\`)\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T05: Create local database instance" \
  "Create local database instance\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T06: Set up database connection and test" \
  "Set up database connection and test connectivity\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T07: Configure environment for staging" \
  "Configure environment variables for staging environment\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "config"'

create_issue \
  "M01-T08: Create staging database instance" \
  "Create staging database instance\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T09: Configure environment for production" \
  "Configure environment variables for production environment\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "config"'

create_issue \
  "M01-T10: Create production database instance" \
  "Create production database instance\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

create_issue \
  "M01-T11: Verify drizzle-kit commands" \
  "Verify \`drizzle-kit\` commands work correctly\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.1 Project Setup & Configuration" \
  '"milestone-01", "setup", "database"'

# 1.2 Database Schema Design (Tasks 12-41)

create_issue \
  "M01-T12: Create schema directory structure" \
  "Create directory structure \`src/db/schema/\`\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T13: Define users table schema" \
  "Define \`users\` table schema with all fields and types\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T14: Define recipes table schema" \
  "Define \`recipes\` table schema with all fields and types\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T15: Define classifications table schema" \
  "Define \`classifications\` table schema with all fields and types\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T16: Define sources table schema" \
  "Define \`sources\` table schema with all fields and types\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T17: Define cookbooks table schema" \
  "Define \`cookbooks\` table schema with all fields and types\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T18: Define meals taxonomy table schema" \
  "Define \`meals\` taxonomy table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "taxonomy"'

create_issue \
  "M01-T19: Define courses taxonomy table schema" \
  "Define \`courses\` taxonomy table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "taxonomy"'

create_issue \
  "M01-T20: Define preparations taxonomy table schema" \
  "Define \`preparations\` taxonomy table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "taxonomy"'

create_issue \
  "M01-T21: Define recipe_meals junction table" \
  "Define \`recipe_meals\` junction table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T22: Define recipe_courses junction table" \
  "Define \`recipe_courses\` junction table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T23: Define recipe_preparations junction table" \
  "Define \`recipe_preparations\` junction table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T24: Define cookbook_recipes junction table" \
  "Define \`cookbook_recipes\` junction table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T25: Define recipe_images table schema" \
  "Define \`recipe_images\` table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T26: Define recipe_likes table schema" \
  "Define \`recipe_likes\` table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T27: Define cookbook_followers table schema" \
  "Define \`cookbook_followers\` table schema\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T28: Set up primary key constraints" \
  "Set up all primary key constraints\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T29: Set up foreign key relationships" \
  "Set up foreign key relationships with proper ON DELETE/UPDATE cascades\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema"'

create_issue \
  "M01-T30: Create indexes on foreign keys" \
  "Create indexes on all foreign key columns\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "performance"'

create_issue \
  "M01-T31: Create search indexes on recipes" \
  "Create indexes on recipe name and ingredients for search\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "performance"'

create_issue \
  "M01-T32: Create auth indexes" \
  "Create indexes on user email and username for auth\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "performance"'

create_issue \
  "M01-T33: Create taxonomy slug indexes" \
  "Create indexes on classification, source, meal, course, preparation slugs\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "schema", "performance"'

create_issue \
  "M01-T34: Generate initial migration" \
  "Generate initial migration file using \`drizzle-kit generate\`\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "migration"'

create_issue \
  "M01-T35: Run migration on local database" \
  "Run migration on local database\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "migration"'

create_issue \
  "M01-T36: Verify tables created correctly" \
  "Verify all tables created with correct structure\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "migration"'

create_issue \
  "M01-T37: Create meals seeder script" \
  "Create seeder script for meals taxonomy data\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "seeding"'

create_issue \
  "M01-T38: Create courses seeder script" \
  "Create seeder script for courses taxonomy data\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "seeding"'

create_issue \
  "M01-T39: Create preparations seeder script" \
  "Create seeder script for preparations taxonomy data\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "seeding"'

create_issue \
  "M01-T40: Test foreign key constraints" \
  "Test foreign key constraints with sample data\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "testing"'

create_issue \
  "M01-T41: Create database documentation" \
  "Create database documentation file\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.2 Database Schema Design" \
  '"milestone-01", "database", "documentation"'

# 1.3 Authentication System (Tasks 42-88) - Creating first 20 for now

create_issue \
  "M01-T42: Install Better-Auth package" \
  "Install Better-Auth package\n\n\`\`\`bash\nnpm install better-auth\n\`\`\`\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "setup"'

create_issue \
  "M01-T43: Create auth configuration file" \
  "Create auth configuration file with database and session settings\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "setup"'

create_issue \
  "M01-T44: Set up auth environment variables" \
  "Set up environment variables for auth secrets\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "config"'

create_issue \
  "M01-T45: Run auth database migration" \
  "Run migration to create auth-related database tables (sessions, verification_tokens)\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "database"'

create_issue \
  "M01-T46: Create auth API route handlers" \
  "Create auth API route handlers (login, register, logout)\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "api"'

create_issue \
  "M01-T47: Create auth context provider" \
  "Create auth context provider component\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "frontend"'

create_issue \
  "M01-T48: Create useAuth hook" \
  "Create \`useAuth()\` hook for auth state and methods\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "frontend"'

create_issue \
  "M01-T49: Create useUser hook" \
  "Create \`useUser()\` hook for current user data\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "frontend"'

create_issue \
  "M01-T50: Set up session storage" \
  "Set up session storage configuration (httpOnly cookies)\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "sessions"'

create_issue \
  "M01-T51: Implement session expiration logic" \
  "Implement session expiration and refresh logic\n\n**Milestone:** 01 - Foundation & Infrastructure\n**Section:** 1.3 Authentication System" \
  '"milestone-01", "auth", "sessions"'

echo ""
echo "Created first 51 issues. Continue with remaining tasks..."
echo "Run this script multiple times or extend it with remaining tasks 52-124."
echo ""
echo "To create all remaining issues, you can extend this script or create them manually via GitHub UI."
