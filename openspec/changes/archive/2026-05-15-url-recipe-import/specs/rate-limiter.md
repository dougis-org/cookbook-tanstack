## ADDED Requirements

### Requirement: RateLimiter class

The system SHALL export `RateLimiter` from `src/lib/rate-limiter.ts` that enforces a per-key rolling window.

Constructor: `new RateLimiter(limit: number, windowMs: number)`

Methods:
- `check(key: string): boolean` — returns `true` if the key is under the limit for the current window
- `record(key: string): void` — records one use for the key

#### Scenario: unknown key — request allowed

- **Given** `RateLimiter(10, 3_600_000)` and `userId` has no recorded uses
- **When** `check(userId)` is called
- **Then** returns `true`

#### Scenario: under limit — request allowed

- **Given** `RateLimiter(10, 3_600_000)` and `userId` has 9 recorded uses in the current window
- **When** `check(userId)` is called
- **Then** returns `true`

#### Scenario: at limit — request blocked

- **Given** `RateLimiter(10, 3_600_000)` and `userId` has 10 recorded uses in the current window
- **When** `check(userId)` is called
- **Then** returns `false`

#### Scenario: window expiry resets counter

- **Given** `userId` has 10 recorded uses and the window has expired (current time is past `windowStart + windowMs`)
- **When** `check(userId)` is called
- **Then** returns `true` (a new window starts)

#### Scenario: record increments the count

- **Given** `userId` has 5 recorded uses
- **When** `record(userId)` is called
- **Then** subsequent `check(userId)` reflects 6 uses

---

### Requirement: urlImportRateLimiter singleton

The module SHALL export a `urlImportRateLimiter` singleton:

```ts
export const urlImportRateLimiter = new RateLimiter(10, 60 * 60 * 1000)
```

#### Scenario: singleton enforces 10/hour limit

- **Given** `urlImportRateLimiter` is imported
- **When** `check` is called 10 times with `record` after each
- **Then** the 11th `check` returns `false`
