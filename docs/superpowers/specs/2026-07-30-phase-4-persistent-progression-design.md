# Odd Tower Phase 4 Persistent Progression Design

**Status:** Approved design, ready for implementation planning  
**Date:** 2026-07-30  
**Scope:** Authentication, PostgreSQL persistence, hero collection, summoning, teams, combat rewards, AFK rewards, persistent UI, mock assets, security, testing, and handoff documentation.

## 1. Outcome

Phase 4 converts the temporary online shared-combat sandbox into an authenticated, persistent MVP without moving gameplay authority to the browser or putting database waits in the 20 Hz combat tick.

The supported player journey is:

1. Restore an existing Supabase session or choose Guest, Create Account, or Sign In.
2. Initialize exactly one persistent profile with starter currencies, one random starter hero, one active team, summon state, and AFK state.
3. Manage a six-hero collection, summon with Gems, convert duplicates to Shards, upgrade Stars, and build a one-to-three-hero team.
4. Join Floor 1 with the saved team and server-derived stats.
5. Receive persistent Gold and Hero EXP through an asynchronous, exactly-once reward pipeline.
6. Return after reload, reconnect, or game-server restart with progression intact.
7. Prepare and claim trusted-time AFK rewards in complete 30-minute intervals.
8. Upgrade an anonymous account to email/password without changing the Supabase user ID or gameplay profile.

The Local Prototype remains independently playable. Bosses, portals, floor progression, PvP, equipment, complex skills, monetization, social systems, final artwork, and all other stated Phase 5 systems remain excluded.

## 2. Architectural Principles

- Supabase Auth establishes identity; the verified JWT subject is the only persistent player identity.
- PostgreSQL constraints, RLS, and transaction functions enforce gameplay invariants.
- The game server is the only application tier allowed to request protected gameplay mutations.
- React and Phaser display authoritative results and never grant currencies, heroes, EXP, Stars, Shards, team slots, summons, combat rewards, or AFK rewards.
- `game-core` remains deterministic and framework-free.
- `network-protocol` remains transport-neutral and owns shared HTTP/WebSocket contracts and validation.
- Combat decisions, movement, monster FSMs, navigation, contributions, and reward eligibility remain room-authoritative.
- Database work occurs outside the combat tick through a bounded queue.
- Every retried mutation reuses the same idempotency identity.
- UI updates are event-driven and semantic; React is not updated every Phaser frame.
- All placeholder visuals resolve through stable Asset IDs and can be replaced without changing gameplay rules.

## 3. Delivery Decomposition

Implementation uses staged vertical slices rather than a database-only or UI-only big bang. Each slice includes its domain rules, database behavior, server boundary, client behavior, and focused tests before the next slice depends on it.

### Slice A: Shared contracts and deterministic progression

- Add Phase 4 domain and response types to the shared protocol package.
- Add strict runtime validators for authenticated API requests and responses.
- Add data-driven hero definitions and deterministic level, Star, and effective-stat calculations to `game-core`.
- Keep the existing level cap of 20 and cumulative EXP curve `floor(50 * level^1.35)`.
- Apply Level growth first and the Star multiplier `1 + 0.08 * (stars - 1)` second, using the existing documented integer rounding convention.

### Slice B: Local Supabase and database authority

- Add project-scoped Supabase CLI commands and local configuration.
- Add timestamped, rebuildable migrations, deterministic seed data, schema versioning, constraints, ownership indexes, RLS policies, and transaction functions.
- Add database tests for schema shape, deterministic reset, functions, concurrency, idempotency, and security isolation.

### Slice C: Server authentication and persistence API

- Add JWT verification, authenticated request middleware, correlation IDs, safe error mapping, rate limiting, and the active-user registry.
- Add framework-independent persistence interfaces with real Supabase and test-only in-memory implementations.
- Add bootstrap and protected gameplay routes.
- Add readiness and persistence-health reporting.

### Slice D: Persistent client shell and collection systems

- Add Supabase browser Auth integration and session restoration.
- Add an event-driven player store and typed API client.
- Add Auth, Home, Collection, Hero Detail, Summon, Team Builder, AFK, and account-protection screens.
- Add the Asset Registry, programmatic mock visuals, manifests, validation, and replacement documentation.

### Slice E: Persistent room and combat rewards

- Authenticate room creation/join and load the persistent team.
- Inject persistent heroes and derived stats into the existing combat simulation.
- Convert eligible rewards into bounded persistence jobs.
- Publish saving, acknowledgement, and degraded-state events without blocking the tick.
- Add restart and authenticated persistence-load coverage.

### Slice F: Fresh verification and handoff

- Rebuild the database from empty migrations, run all application/database/browser/security/restart/load checks, scan production output for secrets, capture mock screenshots, verify health/readiness, and release all project ports.
- Record only observed evidence and mark unexecuted checks as not tested.

## 4. Shared Domain and Contract Boundaries

### `game-core`

`game-core` owns pure functions and immutable configuration for:

- Six hero definitions and role/rarity types.
- EXP-to-Level derivation and Level cap enforcement.
- Effective stat derivation from definition, Level, and Stars.
- Star upgrade cost lookup.
- Team-slot eligibility rules.
- Summon rarity weights, pity rules, and duplicate Shard amounts.
- AFK interval and reward calculations when supplied trusted timestamps.
- Existing reward identity generation, contribution eligibility, monster AI, navigation, and combat math.

It has no Supabase, Express, Colyseus schema, React, Phaser, or browser dependencies.

### `network-protocol`

The protocol package owns:

- Versioned player-bootstrap DTOs.
- Profile, currency, owned-hero, team, banner, summon-history, AFK-claim, persistence-health, and domain-error types.
- Protected API request/response shapes and runtime validators.
- Authenticated room join options containing an access token and protocol version, but no trusted user ID, display name, or hero state.
- Persistent reward acknowledgement and degraded-state presentation messages.

The protocol version is incremented for the incompatible authenticated room contract. Database schema version remains a separate value in bootstrap/readiness responses.

## 5. Authentication Design

The browser uses `@supabase/supabase-js` for Auth only.

### Guest

`signInAnonymously()` creates a Supabase session. The client sends its access token to the bootstrap endpoint. The server verifies the token, derives the subject, atomically initializes the account if absent, and returns the authoritative bootstrap. UI states that Guest progress is tied to the current browser until protected.

### Email/password

Create Account and Sign In use Supabase Auth. The client restores and refreshes sessions through the SDK lifecycle. Gameplay data is fetched from the game server after authentication, never directly mutated from the browser.

### Guest upgrade

The anonymous session attaches email/password credentials using the supported Supabase identity-update flow. Because the underlying Auth user ID remains unchanged, all profile, hero, currency, team, pity, ledger, and AFK foreign keys remain intact. Existing-email conflicts are reported as recoverable errors; Phase 4 does not merge two existing users.

### Sign out

Sign-out first leaves any active room, destroys the online Phaser scene, cancels protected requests, clears the player store and persistence UI state, then signs out the intended local Supabase session and returns to Auth. Database data is not deleted.

### Server verification

An `AuthVerifier` validates signature, issuer, expiration, subject, and project identity using the current supported Supabase verification path. The server stores no refresh token. Tokens, passwords, secrets, and complete authorization headers are never logged.

`ActiveUserRegistry` enforces one online-combat identity per authenticated user in the server process. Reconnection is associated with the same verified user; a second independent join is rejected. Read-only HTTP access remains available, while Summon, Star Upgrade, team mutation, and team-slot unlock are rejected during active combat.

## 6. Database Design

The exposed schema contains the required tables:

- `profiles`
- `hero_definitions`
- `player_heroes`
- `player_currencies`
- `player_teams`
- `team_members`
- `summon_banners`
- `summon_pool_entries`
- `player_summon_state`
- `summon_history`
- `reward_ledger`
- `afk_state`
- `afk_claims`
- a focused schema-version table
- focused idempotency records where an operation does not already have a natural unique key

Columns, checks, foreign keys, uniqueness constraints, timestamps, and lookup indexes follow the approved Phase 4 brief exactly. Integer values are bounded against negative values and unsafe growth. One active team is enforced by a partial unique index.

All exposed tables have RLS enabled. Authenticated users may read only explicitly allowed rows belonging to their JWT subject. Direct browser-role inserts, updates, and deletes of protected gameplay state are denied. Full internal reward metadata is not exposed. Trusted mutation functions use explicit types, fixed safe `search_path`, no dynamic SQL, row locks where concurrency matters, stable domain errors, and execution grants restricted to the trusted server role.

The seed creates exactly six enabled hero definitions and one active Standard Banner with integer summon weights matching 55% Common, 30% Rare, 12% Epic, and 3% Legendary rates.

## 7. Transaction Designs

### Account initialization

`initialize_player_account` is concurrency-safe and idempotent. It creates one profile, Gold 500, Gems 300, Upgrade Jelly 0, one database-selected starter from the three eligible heroes, one active team with the starter in Slot 1, Standard Banner summon state, AFK state, and one starter ledger entry. Existing profiles return their current bootstrap without duplication.

### Summon

`perform_summon` locks the Gem balance and summon state, checks the idempotency key, validates the active banner, performs a trusted roll, applies twentieth-pull Epic-or-Legendary pity, deducts exactly 100 Gems, inserts a new owned hero or adds rarity-based Shards, updates pity, inserts history, and returns the authoritative outcome and balances in one transaction. Concurrent pulls cannot overspend.

### Star upgrade

`upgrade_hero_star` locks the owned hero, validates ownership and the 1-to-5 Star range, deducts the exact 20/50/100/200 Shard cost, increments one Star, and returns the updated hero. Repeated or concurrent requests cannot deduct twice.

### Team update and slot unlock

`update_active_team` validates one to three distinct owned heroes, slot bounds, unlocked slots, and same-user ownership before replacing the complete membership atomically. Slot 2 becomes available once two unique heroes are owned. `unlock_team_slot` requires three unique heroes and atomically deducts 500 Gold for Slot 3. Active-combat restrictions are checked at the server boundary before RPC execution.

### Combat reward

`apply_combat_reward` inserts `(user_id, reward_identity)` into the ledger first. Conflict returns `already_applied`. A new record locks and increments Gold, applies full EXP to living active heroes and half EXP to defeated active heroes, clamps at the Level-20 progression ceiling, and returns authoritative balances and hero progression atomically.

### AFK prepare and claim

`prepare_afk_claim` locks AFK state, calculates complete 30-minute intervals from trusted time, caps at 16 intervals, preserves the partial remainder, and creates one durable pending claim without applying rewards. `claim_afk_reward` locks the pending claim, inserts an idempotent ledger record, adds 50 Gold, 20 EXP per active-team hero, and one Upgrade Jelly per interval, then marks the claim claimed atomically.

## 8. Persistence Service and Queue

`PlayerPersistenceService` contains typed operations for initialization/bootstrap, profile update, Summon, team update/unlock, Star upgrade, AFK prepare/claim, combat reward application, and activity tracking. Express routes depend only on this interface and never contain SQL.

The production implementation calls Supabase RPCs with the server-only secret. The in-memory implementation exists only for isolated tests and fault injection; it is not a production fallback and never replaces required persistence.

Combat rewards use a global bounded queue with per-room ownership:

- concurrency: 4
- maximum pending jobs per room: 200
- retry attempts: 5
- initial retry delay: 250 ms
- maximum retry delay: 5 seconds
- graceful flush timeout: 10 seconds

The combat tick computes eligibility and enqueues immutable jobs without awaiting them. Retries reuse the original reward identity and idempotency key. Queue metrics use bounded counters/windows.

If health is unavailable, a queue saturates, or a player reward exhausts retries, persistence becomes degraded. New reward-bearing attacks stop safely, Auto Hunt is disabled, movement and room presence remain where possible, and the HUD explains that saving is paused. Health probes can restore operation. Unsaved rewards are never silently represented as durable.

## 9. Persistent Combat Integration and AI Preservation

Room creation and resolution routes require a Bearer token. Room join sends only the access token and protocol version. `FloorOneRoom.onAuth` verifies the token, checks the active-user registry, loads the profile and active team, and builds authoritative heroes using shared derived-stat functions.

The current decision/motion/path separation remains intact:

- `CombatSimulation` decides target selection, state transitions, attacks, contributions, rewards, and Auto Hunt intent.
- `MonsterNavigator` continues to own collision-aware direct travel, stuck detection, cached A\*, and waypoint following.
- The 20 Hz fixed-step scheduler, 5 Hz expensive decisions, 1 Hz wander cadence, and at-most-2 Hz path recalculation remain unchanged.

Persistent team injection replaces the fixed three-hero online factory only for authenticated online play. Local Prototype factories and session behavior remain unchanged.

During the reconnection grace period, room HP, contribution state, queue acknowledgements, and the authenticated identity remain associated with the same session. Reconnection verifies the same user and resets Auto Hunt to manual. After grace expiry, transient combat HP may be discarded, while all acknowledged database progression remains.

## 10. API and Error Design

Protected routes cover bootstrap, profile update, team update, slot unlock, Star upgrade, Summon, AFK prepare/claim, bounded Summon history, room creation/resolution, and persistence health. Middleware performs:

1. Correlation/request ID assignment.
2. Safe CORS checks.
3. Bearer extraction and JWT verification.
4. Per-IP and per-user rate limiting.
5. Runtime request validation.
6. Active-combat restriction checks.
7. Persistence-service invocation.
8. Stable error translation without stack traces or database details.

Every mutation requires an idempotency key and preserves it during retry. The server maps database failures to the approved domain codes, and the client maps those codes to clear, user-safe copy.

`/health` reports process liveness. `/ready` requires valid configuration, reachable Supabase, supported schema version, required seeds, and an available queue. `/api/persistence/health` exposes bounded status and metrics without connection strings or secrets.

## 11. Client State and UI Flow

The application shell uses an explicit screen stack/state machine:

- Auth
- Home
- Collection
- Hero Detail
- Summon
- Team Builder
- AFK modal
- Profile/Protect Account
- Online lobby
- Online room
- Local Prototype as a separate preserved path

The player store subscribes to Auth changes once, restores the session once, keeps the last valid bootstrap during safe transient loads, aborts stale requests, prevents double submission, and clears protected state on sign-out. Currency, ownership, reward, and progression changes are never optimistic. Successful mutations merge or refresh authoritative server responses.

Screens are lazy-loaded to avoid expanding the existing single client chunk unnecessarily. The Phaser combat scene remains separately lifecycle-owned and is created only for active play.

## 12. UI/UX System

The existing Phase 3.5 cream/pastel/chocolate sticker language is extended through centralized tokens for color, typography, spacing, radius, shadow, layers, rarity, currency, success, error, and motion.

All persistent screens use responsive grid/flex/container layout rather than resolution-specific absolute positioning. Critical controls sit within CSS safe-area insets. Portrait and landscape layouts are both supported. Touch controls are at least 48 CSS pixels.

Every screen provides an initial focused control, logical keyboard navigation, visible focus distinct from hover, modal focus trapping/restoration, accessible labels/live regions, text-plus-color state communication, Thai-compatible font fallbacks, and `prefers-reduced-motion` behavior.

Collection shows all six definitions with owned/unowned, filters, sorting, loading, empty, and error states. Hero Detail shows EXP, Level, Stars, Shards, derived stats, team status, and Star upgrade affordability. Summon reveals only the authoritative result and never optimistically deducts Gems. Team Builder supports tap-then-slot assignment on mobile, optional desktop dragging, complete-save semantics, and clear locked-slot rules. AFK displays server-derived duration, interval count, cap, rewards, affected heroes, claim state, and recovery errors.

## 13. Mock Asset Architecture

All final-art locations resolve through stable Asset IDs in a centralized registry. Registry entries identify either a programmatic mock renderer or a replaceable target file. Components and Phaser code never hardcode final asset paths.

Mocks use project-authored inline SVG, CSS shapes/gradients, Phaser Graphics, and primitive particle effects. Missing assets resolve to explicit clean fallbacks and cannot crash the application. Development may identify missing Asset IDs; production shows only the fallback.

The manifest contains every required field from the Phase 4 brief and includes the full six-hero directional/frame set, rarity frames, currencies, Summon, Team, AFK, Auth/Home, general UI, existing monsters, map, and VFX replacement locations. JSON is schema-validated and kept consistent with CSV and the runtime registry. The report gives exact counts and technical replacement guidance without final image-generation prompts.

## 14. Testing Strategy

Implementation follows red/green/refactor for each independently testable behavior.

- Pure unit tests: progression, stats, pity, Shards, team rules, AFK intervals, validation, error mapping, and queue behavior.
- Database tests: clean rebuild, deterministic seed, indexes, schema version, RLS isolation, denied direct mutations, every transaction function, concurrency, idempotency, and trusted-time behavior.
- Server tests: JWT rejection, API validation/rates, active-user rules, persistence health, fault recovery, bounded queue, degraded mode, graceful flush, and room integration.
- Client tests: Auth lifecycle, store cleanup, stale-request abortion, mutation double-submit prevention, screen states, focus/accessibility, reduced motion, and asset fallbacks.
- Browser tests: Guest, permanent account, Guest upgrade, collection, Summon, Team, persistent combat acknowledgement, AFK, reload, restart, mobile screens, and existing regressions.
- Load test: ten authenticated users, fifty monsters, at least 60 seconds, persistent rewards enabled, at least 1,140 ticks and 19 Hz, no duplicates/disconnects/invalid rejections/server errors, and zero unresolved jobs after flush.
- Security verification: production bundle/source-map secret scan, token-log scan, cross-user tests, RLS reset verification, JWT tests, and production dependency audit.

Test-only RNG/time controls require `ODD_TOWER_TEST_MODE=1` and cannot activate in production.

## 15. Failure Handling and Observability

Database errors are translated into stable domain codes. User responses include a request ID where useful, never a stack trace or database detail. Logs include correlation IDs and bounded structured metrics but exclude passwords, access/refresh tokens, secret keys, and complete Auth headers.

Metrics cover Auth verification, bootstrap, initialization, gameplay mutations, AFK, persistence jobs, retries/failures/queue depth, database latency, degraded transitions, schema failures, and room tick rate. Latency samples and histories are bounded.

## 16. Verification Baseline and Environment Constraints

Observed before Phase 4 source changes:

- `npm ci`: passed after stopping a pre-existing Vite process that locked Rolldown; 575 packages installed.
- Formatting, ESLint, strict TypeScript, and production build: passed.
- Vitest: 127/127 passed across 24 files.
- Coverage: 92.20% statements/lines, 88.45% branches, 89.71% functions.
- Production dependency audit: zero vulnerabilities.
- Ten-client movement load: 9,761 commands, zero rejected commands, disconnects, or server errors; cleanup passed.
- Ten-client/fifty-monster hardening load: 1,199/1,200 ticks, 19.98 Hz, zero duplicate rewards, disconnects, rejected valid commands, or server errors; cleanup passed.
- The fresh full Playwright matrix did not finish within the 244-second command wrapper and was terminated; the run emitted only the expected deliberate-offline SDK warnings before termination. It must be rerun with a sufficient wrapper timeout before Phase 4 implementation claims.
- Docker Desktop client 29.5.2 is installed, but its Linux engine was not running during design. Local Supabase verification requires the engine to be started.
- Ports 2567 and 4173 were occupied by existing project processes at discovery. Those exact processes were stopped for clean installation; only TIME_WAIT connections remained afterward.
- The production client currently emits a known large-chunk warning at approximately 1.55 MB minified.

## 17. Completion Rules

Phase 4 is complete only when the approved brief's database, Auth, security, restart, browser, asset-manifest, persistent-load, regression, documentation, and cleanup evidence all pass. Missing Docker/database/browser evidence must be reported as an explicit blocker and results in `Phase 5 readiness: NOT READY`.

No Git command may be executed. Files are changed directly in the current workspace and tracked through implementation notes.
