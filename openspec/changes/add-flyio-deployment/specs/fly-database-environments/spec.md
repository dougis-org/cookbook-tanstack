## ADDED Requirements

### Requirement: Two separate Fly Postgres clusters are provisioned
The infrastructure SHALL include two Fly Postgres clusters: one for production (`cookbook-db-prod`) and one for the test/staging environment (`cookbook-db-test`), each isolated from the other.

#### Scenario: Prod and test databases are separate clusters
- **WHEN** a developer lists Fly Postgres apps via `fly postgres list`
- **THEN** both `cookbook-db-prod` and `cookbook-db-test` appear as independent apps

#### Scenario: Test environment operations do not affect prod data
- **WHEN** a seed or destructive operation is run against the test database
- **THEN** the production database is unaffected

### Requirement: DATABASE_URL is injected via Fly secrets, not committed to source control
Each environment's `DATABASE_URL` SHALL be stored as a Fly secret and never written to any file that is committed to git.

#### Scenario: Prod DATABASE_URL is set as a Fly secret
- **WHEN** `fly secrets list --app cookbook-tanstack` is run
- **THEN** `DATABASE_URL` appears in the secrets list (value redacted)

#### Scenario: DATABASE_URL is not present in the repository
- **WHEN** the git history is searched for production connection strings
- **THEN** no Fly Postgres connection string appears in any committed file

### Requirement: Prod DB is attached to the Fly app via fly postgres attach
The production Fly Postgres cluster SHALL be attached to the `cookbook-tanstack` Fly app so the `DATABASE_URL` secret is automatically set.

#### Scenario: Attaching prod DB sets DATABASE_URL secret automatically
- **WHEN** `fly postgres attach cookbook-db-prod --app cookbook-tanstack` is run
- **THEN** Fly sets `DATABASE_URL` in the app's secrets with a connection string using the internal `.flycast` hostname

### Requirement: Drizzle migrations run against the correct environment
The `db:migrate` command SHALL use the `DATABASE_URL` from the environment, applying pending migrations to whichever database is configured.

#### Scenario: Release command migrates prod database on deploy
- **WHEN** a new version is deployed to `cookbook-tanstack`
- **THEN** the `db:migrate` release command connects to `DATABASE_URL` (prod DB) and applies any pending migrations

#### Scenario: Manual migration against test DB uses correct credentials
- **WHEN** a developer runs `fly ssh console -a cookbook-tanstack-test -C "npm run db:migrate"`
- **THEN** migrations are applied to `cookbook-db-test` only

### Requirement: Taxonomy seed data is loaded into the prod database on first deployment
On first deployment the taxonomy seed data (meals, courses, preparations) SHALL be loaded into the production database.

#### Scenario: Seed script is idempotent
- **WHEN** `npm run db:seed` is run multiple times against the same database
- **THEN** no duplicate rows are inserted and no errors occur

#### Scenario: Prod seed is run once after initial migration
- **WHEN** the production database is freshly migrated for the first time
- **THEN** a developer runs `fly ssh console -a cookbook-tanstack -C "npm run db:seed"` to populate taxonomy data
