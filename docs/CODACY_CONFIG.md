# Codacy Configuration Documentation

## Overview

This project is configured to use Codacy with a focus on JavaScript/TypeScript code quality and security scanning. The database migration files use PostgreSQL 16 DDL syntax.

## SQL Server Pattern Exclusions

The following Codacy patterns have been excluded because they are specific to SQL Server T-SQL and are not applicable to this project's PostgreSQL 16 database:

### 1. Table Data Compression
- **Pattern:** "Expected table to use data compression"
- **Reason:** Data compression is a SQL Server feature. PostgreSQL uses different storage mechanisms and doesn't have this feature.
- **Applicability:** Not applicable to PostgreSQL tables
- **Resolution:** Excluded via `.codacy.yml` and migration file headers

### 2. QUOTED_IDENTIFIER Setting
- **Pattern:** "Expected SET QUOTED_IDENTIFIER ON near top of file"
- **Reason:** `SET QUOTED_IDENTIFIER` is a SQL Server T-SQL directive. PostgreSQL handles identifier quoting differently using the `"double_quotes"` syntax built into the language.
- **Applicability:** Not applicable to PostgreSQL
- **Resolution:** Excluded via `.codacy.yml` and migration file headers

## Configuration Files

### .codacy.yml (Root Level)
Main Codacy configuration file that:
- Excludes migration files from SQL Server-specific checks
- Disables problematic patterns via regex exclusions
- Configures enabled tools (ESLint, Pylint, Trivy, etc.)

### .codacy/codacy.yaml
Tools and runtime declarations:
- Specifies which analysis tools to run
- Excludes drizzle migration directory from general code analysis

### drizzle/0000_nice_giant_man.sql
Initial PostgreSQL migration file with:
- Header comments explaining PostgreSQL vs SQL Server syntax
- Proper PostgreSQL DDL (CREATE EXTENSION, CREATE TABLE, etc.)
- Composite primary keys, foreign keys, and indexes appropriate for PostgreSQL

## Why These Exclusions Are Necessary

The Codacy platform includes multiple analysis tools, some of which may have overlapping pattern detection. When analyzing SQL files, some tools default to SQL Server T-SQL rules. Since this project uses PostgreSQL exclusively:

1. **No SQL Server Features Are Used:** The migration contains only standard PostgreSQL DDL
2. **Unnecessary Alerts:** SQL Server-specific patterns generate false positives
3. **Focus on Relevant Issues:** Excluding inapplicable patterns keeps the issue list focused on actual code quality concerns

## Recommended Codacy Admin Actions

If you have admin access to the Codacy project dashboard:

1. **Verify Pattern Exclusions:** Confirm that the SQL Server patterns are properly excluded
2. **SQL Tool Configuration:** Consider configuring any SQL analysis tools to target PostgreSQL instead of SQL Server
3. **Monitor False Positives:** Watch for any new SQL Server-related alerts and report them as false positives

## Future Database Migrations

All future PostgreSQL migrations will include similar headers explaining they use PostgreSQL syntax, not SQL Server T-SQL.

## PostgreSQL Version

This project targets **PostgreSQL 16** with the following extensions enabled:
- `pgcrypto` (for UUID generation via `gen_random_uuid()`)

See [docs/database.md](../docs/database.md) for complete database schema documentation.
