## ADDED Requirements

### Requirement: Local development supports two database options
The development setup SHALL support two interchangeable local database options, selected by the value of `DATABASE_URL` in `.env.local`. No code changes are required to switch between them.

#### Scenario: Developer on local network uses the persistent network server
- **WHEN** a developer on the local network sets `DATABASE_URL` in `.env.local` to the `sponky.dougis.com` connection string
- **THEN** `npm run dev` starts the app and Drizzle connects to the persistent network Postgres without requiring Docker to be running

#### Scenario: Developer working remotely uses Docker compose
- **WHEN** a developer is off-network or the network server is unreachable
- **THEN** they run `docker compose up -d` and set `DATABASE_URL` to the local Docker Postgres connection string
- **THEN** `npm run dev` starts the app and Drizzle connects to the Docker instance

#### Scenario: Switching between options requires only a DATABASE_URL change
- **WHEN** a developer updates `DATABASE_URL` in `.env.local` from the network server to the Docker connection string (or vice versa)
- **THEN** no other configuration, code, or schema files need to change

### Requirement: DATABASE_URL is never committed to source control
The `DATABASE_URL` for local development SHALL be stored only in `.env.local`, which is gitignored, and SHALL never appear in any committed file.

#### Scenario: .env.local is excluded from git
- **WHEN** `git status` is run after creating `.env.local`
- **THEN** `.env.local` does not appear in tracked or staged files

#### Scenario: .env.example documents required variables without real values
- **WHEN** a developer clones the repository and opens `.env.example`
- **THEN** `DATABASE_URL` is listed with a placeholder value and a comment explaining the two local dev options

### Requirement: Local dev database is migrated and seeded before first use
Regardless of which local database option is chosen, the developer SHALL run Drizzle migrations and the taxonomy seed before starting the app for the first time against that database.

#### Scenario: Fresh network server database is ready after setup steps
- **WHEN** a developer points `DATABASE_URL` at `sponky.dougis.com` and runs `npm run db:push` then `npm run db:seed`
- **THEN** all tables exist and taxonomy data (meals, courses, preparations) is present

#### Scenario: Fresh Docker database is ready after setup steps
- **WHEN** a developer runs `docker compose up -d`, then `npm run db:push`, then `npm run db:seed`
- **THEN** all tables exist and taxonomy data is present in the Docker Postgres instance
