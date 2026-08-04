# Shard MMORPG Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a feature-flagged end-to-end MMO foundation that automatically assigns an authenticated account to one authoritative channel, safely persists a checkpoint, and renders transparent entry and recovery states without changing legacy behavior.

**Architecture:** Introduce a versioned MMO protocol envelope and a pure combat-kernel facade, then build an in-process World Directory and Channel Registry behind interfaces that can later move to separate services. Register a new `mmo_zone_v1` Colyseus room beside `floor_one`, persist additive world checkpoints through the existing persistence seam, and expose the new route only to flagged accounts.

**Tech Stack:** TypeScript 5.9, Node.js 24, Colyseus 0.17, React 19, Phaser 3.90, Supabase/Postgres, Vitest 3, Playwright 1.55

## Global Constraints

- Do not edit or remove the legacy `floor_one` room behavior or current online lobby contracts.
- All new entry is disabled unless `MMO_WORLD_ENABLED=1`; enabled deployments admit all authenticated accounts by default.
- A channel admits at most 30 connected accounts.
- An account may own only one authoritative MMO channel lease.
- Protocol version is `4`; incompatible clients fail before room admission.
- New database objects are additive and protected by row-level security.
- Pending rewards are out of scope for this slice; the protocol reserves their state without granting any reward.
- Every task ends with focused tests and a commit.

---

## File Structure

### Shared packages

- `packages/game-core/src/kernel/combat-kernel.ts` — stable facade over reusable deterministic rules.
- `packages/game-core/tests/combat-kernel.test.ts` — facade determinism and compatibility fixtures.
- `packages/network-protocol/src/mmo/envelope.ts` — protocol v4 command, snapshot, error, and revision types.
- `packages/network-protocol/src/mmo/validation.ts` — strict runtime parsing of entry and movement envelopes.
- `packages/network-protocol/tests/mmo-validation.test.ts` — accepted and rejected payload fixtures.

### Server

- `apps/game-server/src/mmo/directory/WorldDirectory.ts` — assignment, reconnect reservation, and one-lease invariant.
- `apps/game-server/src/mmo/channels/ChannelRegistry.ts` — bounded channel creation and capacity accounting.
- `apps/game-server/src/mmo/channels/MmoZoneRoom.ts` — feature-flagged Colyseus room adapter.
- `apps/game-server/src/mmo/persistence/WorldCheckpointRepository.ts` — checkpoint interface and Supabase adapter.
- `apps/game-server/src/mmo/featureFlags.ts` — environment and account eligibility.
- `apps/game-server/tests/mmo/*.test.ts` — directory, registry, room, checkpoint, and flag tests.
- `supabase/migrations/20260804000100_mmo_world_foundation.sql` — additive checkpoint, lease audit, and RLS schema.
- `supabase/tests/mmo_world_foundation.sql` — database authorization and invariant tests.

### Client

- `apps/client/src/mmo/MmoWorldClient.ts` — automatic assignment/join and protocol v4 handling.
- `apps/client/src/mmo/MmoWorldBridge.ts` — event-driven React/Phaser state boundary.
- `apps/client/src/ui/mmo/MmoEntryScreen.tsx` — locating, joining, recovery, and incompatibility states.
- `apps/client/src/ui/mmo/MmoWorldShell.tsx` — minimal Phaser mount plus accessible status HUD.
- `apps/client/src/ui/mmo/mmo-shell.css` — safe-area and responsive foundation styles.
- `apps/client/tests/MmoEntryScreen.test.tsx` and `apps/client/tests/MmoWorldClient.test.ts` — entry behavior.
- `tests/e2e/mmo-foundation.spec.ts` — authenticated automatic-entry and rollback-route coverage.

## Task 1: Deterministic Combat-Kernel Facade

**Files:**
- Create: `packages/game-core/src/kernel/combat-kernel.ts`
- Create: `packages/game-core/tests/combat-kernel.test.ts`
- Modify: `packages/game-core/src/index.ts`

**Interfaces:**
- Produces: `COMBAT_KERNEL_VERSION = 1`, `CombatKernelInput`, `CombatKernelOutput`, and `stepCombatKernel(input: Readonly<CombatKernelInput>): CombatKernelOutput`.
- `CombatKernelInput` contains `tick`, `seed`, readonly hero snapshots, readonly monster snapshots, and readonly intents.
- `CombatKernelOutput` contains a new immutable hero array, monster array, and ordered combat-event array.

- [ ] **Step 1: Write a failing fixture test**

Create a test that loads two identical frozen inputs, calls `stepCombatKernel` for each, and asserts deep equality, unchanged input objects, ordered event IDs, and `COMBAT_KERNEL_VERSION === 1`. Add a second fixture asserting the facade delegates current damage and cooldown formulas rather than redefining them.

- [ ] **Step 2: Verify the test fails**

Run: `npx vitest run packages/game-core/tests/combat-kernel.test.ts`

Expected: FAIL because `../src/kernel/combat-kernel.js` does not exist.

- [ ] **Step 3: Implement the minimal pure facade**

Define readonly serializable input/output types. Clone only mutable result records, call existing exported combat functions, sort simultaneous events by stable entity ID, and never import server, clock, random-global, database, or network modules.

- [ ] **Step 4: Export and verify**

Add `export * from './kernel/combat-kernel.js';` to `packages/game-core/src/index.ts`.

Run: `npx vitest run packages/game-core/tests/combat-kernel.test.ts packages/game-core/tests/combat-phase3.test.ts`

Expected: PASS with legacy combat fixtures unchanged.

- [ ] **Step 5: Commit**

```text
git add packages/game-core/src/kernel/combat-kernel.ts packages/game-core/src/index.ts packages/game-core/tests/combat-kernel.test.ts
git commit -m "refactor: expose deterministic combat kernel"
```

## Task 2: Versioned MMO Protocol Envelope

**Files:**
- Create: `packages/network-protocol/src/mmo/envelope.ts`
- Create: `packages/network-protocol/src/mmo/validation.ts`
- Create: `packages/network-protocol/tests/mmo-validation.test.ts`
- Modify: `packages/network-protocol/src/index.ts`

**Interfaces:**
- Produces: `MMO_PROTOCOL_VERSION = 4`.
- Produces: `MmoEntryRequest { protocolVersion: 4; requestId: string; preferredRegion: string }`.
- Produces: `MmoCommandEnvelope { protocolVersion: 4; sessionId: string; sequence: number; worldRevision: number; command: MmoCommand }`.
- `MmoCommand` is initially `movement`, `target-preference`, `auto-hunt`, or `interact`.
- Produces: `parseMmoEntryRequest(value: unknown): MmoEntryRequest` and `parseMmoCommandEnvelope(value: unknown): MmoCommandEnvelope`.

- [ ] **Step 1: Write rejection-first validation tests**

Cover valid entry, protocol 3 rejection, unknown fields, empty request ID, sequence below zero, non-integer revision, diagonal movement, invalid target ID, and an unknown command type. Assert parsers return new objects and never coerce strings into numbers.

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run packages/network-protocol/tests/mmo-validation.test.ts`

Expected: FAIL because the MMO exports do not exist.

- [ ] **Step 3: Implement strict types and parsers**

Use explicit object, key-set, string-length, finite-number, integer, enum, and discriminated-union checks. Movement accepts cardinal `up | down | left | right | idle` only. Return a typed protocol error with code `protocol_mismatch` for versions other than 4.

- [ ] **Step 4: Export and verify**

Add exports for both files to `packages/network-protocol/src/index.ts`.

Run: `npx vitest run packages/network-protocol/tests/mmo-validation.test.ts packages/network-protocol/tests/validation.test.ts`

Expected: PASS with protocol v3 tests unchanged.

- [ ] **Step 5: Commit**

```text
git add packages/network-protocol/src/mmo packages/network-protocol/src/index.ts packages/network-protocol/tests/mmo-validation.test.ts
git commit -m "feat: add versioned MMO protocol envelope"
```

## Task 3: Channel Registry and World Directory

**Files:**
- Create: `apps/game-server/src/mmo/channels/ChannelRegistry.ts`
- Create: `apps/game-server/src/mmo/directory/WorldDirectory.ts`
- Create: `apps/game-server/tests/mmo/channelRegistry.test.ts`
- Create: `apps/game-server/tests/mmo/worldDirectory.test.ts`

**Interfaces:**
- Produces: `ChannelRecord { channelId; zoneId; region; population; capacity; status; createdAtMs }`.
- Produces: `ChannelRegistry.assign(zoneId, region, partySize): ChannelRecord` and `release(channelId, count): void`.
- Produces: `WorldDirectory.assign(request: AssignmentRequest): AssignmentResult`.
- `AssignmentRequest` contains `accountId`, `zoneId`, `region`, optional `partyAccountIds`, optional `friendChannelId`, and `nowMs`.
- `AssignmentResult` contains `channelId`, `leaseId`, `expiresAtMs`, and `reason`.

- [ ] **Step 1: Write capacity and affinity tests**

Test least-disruptive healthy channel selection, hard capacity 30, whole-party fit, accepted friend-channel preference, reconnect lease reuse, creation when no channel fits, release accounting, expired lease replacement, and exactly one active lease per account.

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run apps/game-server/tests/mmo/channelRegistry.test.ts apps/game-server/tests/mmo/worldDirectory.test.ts`

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement deterministic in-memory registries**

Inject `nowMs` and ID factories; do not call `Date.now()` or random UUID APIs internally. Sort candidates by friend/reconnect affinity, capacity fit, population distance from 20, creation time, then channel ID. Reserve all party slots atomically or none.

- [ ] **Step 4: Verify invariants**

Run: `npx vitest run apps/game-server/tests/mmo/channelRegistry.test.ts apps/game-server/tests/mmo/worldDirectory.test.ts --coverage.enabled`

Expected: PASS, including 1,000 generated assignment/release sequences with no population outside `[0, 30]` and no account with multiple leases.

- [ ] **Step 5: Commit**

```text
git add apps/game-server/src/mmo/channels/ChannelRegistry.ts apps/game-server/src/mmo/directory/WorldDirectory.ts apps/game-server/tests/mmo
git commit -m "feat: add MMO world directory and channel registry"
```

## Task 4: Additive World Checkpoint Persistence

**Files:**
- Create: `supabase/migrations/20260804000100_mmo_world_foundation.sql`
- Create: `supabase/tests/mmo_world_foundation.sql`
- Create: `apps/game-server/src/mmo/persistence/WorldCheckpointRepository.ts`
- Create: `apps/game-server/tests/mmo/worldCheckpointRepository.test.ts`
- Modify: `packages/network-protocol/src/database.types.ts` through `npm run db:types`

**Interfaces:**
- Produces table `public.mmo_world_checkpoints(account_id uuid primary key, zone_id text, sanctuary_id text, channel_hint text null, revision bigint, checkpointed_at timestamptz, payload jsonb)`.
- Produces table `private.mmo_lease_audit(lease_id uuid primary key, account_id uuid, channel_id text, state text, created_at timestamptz, released_at timestamptz null)`.
- Produces: `WorldCheckpointRepository.load(accountId): Promise<WorldCheckpoint | null>`.
- Produces: `WorldCheckpointRepository.saveIfNewer(checkpoint): Promise<'saved' | 'stale'>`.

- [ ] **Step 1: Write failing SQL authorization tests**

Assert authenticated users can select only their own public checkpoint, cannot insert/update directly, anonymous users receive no row, service role can upsert, revisions never decrease, and lease audit is inaccessible through the public API.

- [ ] **Step 2: Apply migration and verify SQL tests**

Run: `npm run db:reset && npm run db:test`

Expected before implementation: FAIL because tables and policies do not exist.

- [ ] **Step 3: Implement additive schema and repository**

Add check constraints for non-empty zone/sanctuary IDs, non-negative revision, known lease states, and JSON object payload. Implement server-only compare-and-upsert by `account_id` and `revision`; never overwrite a newer checkpoint.

- [ ] **Step 4: Regenerate types and verify**

Run: `npm run db:reset && npm run db:test && npm run db:types && npx vitest run apps/game-server/tests/mmo/worldCheckpointRepository.test.ts`

Expected: PASS with existing database tests unchanged.

- [ ] **Step 5: Commit**

```text
git add supabase/migrations/20260804000100_mmo_world_foundation.sql supabase/tests/mmo_world_foundation.sql apps/game-server/src/mmo/persistence/WorldCheckpointRepository.ts apps/game-server/tests/mmo/worldCheckpointRepository.test.ts packages/network-protocol/src/database.types.ts
git commit -m "feat: persist additive MMO world checkpoints"
```

## Task 5: Feature Flags and MMO Zone Room

**Files:**
- Create: `apps/game-server/src/mmo/featureFlags.ts`
- Create: `apps/game-server/src/mmo/channels/MmoZoneRoom.ts`
- Create: `apps/game-server/tests/mmo/featureFlags.test.ts`
- Create: `apps/game-server/tests/mmo/mmoZoneRoom.test.ts`
- Modify: `apps/game-server/src/app.ts`
- Modify: `apps/game-server/src/config.ts`

**Interfaces:**
- Produces: `MmoFeatureFlags { worldEnabled: boolean; eligibleAccountIds: ReadonlySet<string> }`.
- Produces: `isMmoEligible(accountId, flags): boolean`.
- Registers Colyseus room name `mmo_zone_v1` only when `worldEnabled` is true.
- `MmoZoneRoom` validates protocol v4 before admission, acquires one directory lease, restores a checkpoint, and releases its lease on final disconnect.

- [ ] **Step 1: Write disabled-by-default and admission tests**

Test absent env, explicit `0`, explicit `1` with empty cohort, normalized account allowlist, non-v4 rejection, unauthenticated rejection, 31st-player rejection, one-account/two-room rejection, reconnect reservation, and lease release after grace expiry.

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run apps/game-server/tests/mmo/featureFlags.test.ts apps/game-server/tests/mmo/mmoZoneRoom.test.ts`

Expected: FAIL because the feature and room do not exist.

- [ ] **Step 3: Implement the feature boundary and minimal room**

Read `MMO_WORLD_ENABLED` and comma-separated `MMO_WORLD_ACCOUNT_IDS` in server-only config. Keep legacy room registration unchanged. The MMO room admits through the World Directory, publishes `channelId`, `zoneId`, `population`, `worldRevision`, and connection state, and accepts only validated protocol-v4 envelopes with increasing sequences.

- [ ] **Step 4: Verify legacy isolation**

Run: `npx vitest run apps/game-server/tests/mmo apps/game-server/tests/room.test.ts apps/game-server/tests/authVerifier.test.ts`

Expected: PASS; legacy room tests produce identical snapshots.

- [ ] **Step 5: Commit**

```text
git add apps/game-server/src/mmo apps/game-server/tests/mmo apps/game-server/src/app.ts apps/game-server/src/config.ts
git commit -m "feat: register feature-flagged MMO zone room"
```

## Task 6: Automatic MMO Client Entry and Event Bridge

**Files:**
- Create: `apps/client/src/mmo/MmoWorldBridge.ts`
- Create: `apps/client/src/mmo/MmoWorldClient.ts`
- Create: `apps/client/tests/MmoWorldClient.test.ts`
- Create: `apps/client/tests/MmoWorldBridge.test.ts`

**Interfaces:**
- Produces `MmoConnectionState = 'idle' | 'locating' | 'joining' | 'connected' | 'recovering' | 'incompatible' | 'failed'`.
- Produces `MmoWorldUiState { connection; zoneId; channelId; population; worldRevision; errorCode }`.
- Produces `MmoWorldClient.connect(accessToken): Promise<void>`, `disconnect(): Promise<void>`, and `sendMovement(direction): void`.
- Produces event-driven `MmoWorldBridge.subscribe(listener): () => void` and immutable `snapshot()`.

- [ ] **Step 1: Write connection-state tests**

Use a fake Colyseus client to cover locating-to-connected, protocol mismatch, join failure, disconnect recovery, monotonic revision filtering, duplicate snapshot suppression, movement sequence increments, and no command before connection.

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run apps/client/tests/MmoWorldClient.test.ts apps/client/tests/MmoWorldBridge.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement client and bridge**

Join `mmo_zone_v1` automatically using protocol 4 and the authenticated token. Keep transport access inside `MmoWorldClient`; publish immutable UI state through the bridge. Never persist access tokens or expose server-only assignment details.

- [ ] **Step 4: Verify**

Run: `npx vitest run apps/client/tests/MmoWorldClient.test.ts apps/client/tests/MmoWorldBridge.test.ts apps/client/tests/MultiplayerClient.test.ts`

Expected: PASS with the legacy multiplayer client unchanged.

- [ ] **Step 5: Commit**

```text
git add apps/client/src/mmo apps/client/tests/MmoWorldClient.test.ts apps/client/tests/MmoWorldBridge.test.ts
git commit -m "feat: add automatic MMO world client"
```

## Task 7: Feature-Flagged Mobile Entry and World Shell

**Files:**
- Create: `apps/client/src/ui/mmo/MmoEntryScreen.tsx`
- Create: `apps/client/src/ui/mmo/MmoWorldShell.tsx`
- Create: `apps/client/src/ui/mmo/mmo-shell.css`
- Create: `apps/client/tests/MmoEntryScreen.test.tsx`
- Modify: `apps/client/src/App.tsx`
- Modify: `apps/client/src/ui/persistent/PersistentShell.tsx`

**Interfaces:**
- `PersistentShell` gains optional `onContinueMmo?: () => void` and `mmoEligible?: boolean`.
- `MmoEntryScreen` consumes `MmoWorldUiState`, `onRetry`, and `onReturnToLegacy`.
- `MmoWorldShell` consumes the bridge/client and renders the minimal Phaser mount, connection status, zone/channel label, population, safe-area movement control, and leave action.

- [ ] **Step 1: Write accessible state tests**

Cover hidden entry for ineligible accounts, `Continue Adventure` for eligible accounts, locating/joining status announcements, incompatible-client update message, recoverable retry, legacy return, population label, safe-area class, and no room-code field in automatic entry.

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run apps/client/tests/MmoEntryScreen.test.tsx apps/client/tests/PersistentShellUi.test.tsx`

Expected: FAIL because the new screen and props do not exist.

- [ ] **Step 3: Implement the minimal responsive shell**

Add `mmo-entry`, `mmo-world`, and `mmo-recovery` modes without changing legacy mode names. Use `env(safe-area-inset-*)`, a 48 px minimum movement control, `role=status` for transitions, `role=alert` only for terminal failures, and immediate reduced-motion transitions. The feature flag must default false in the client build.

- [ ] **Step 4: Verify component and build behavior**

Run: `npx vitest run apps/client/tests/MmoEntryScreen.test.tsx apps/client/tests/PersistentShellUi.test.tsx && npm run build:client`

Expected: PASS with no legacy snapshot or accessible-name regressions.

- [ ] **Step 5: Commit**

```text
git add apps/client/src/ui/mmo apps/client/src/App.tsx apps/client/src/ui/persistent/PersistentShell.tsx apps/client/tests/MmoEntryScreen.test.tsx
git commit -m "feat: add feature-flagged MMO world entry"
```

## Task 8: End-to-End Recovery, Load Baseline, and Gate Report

**Files:**
- Create: `tests/e2e/mmo-foundation.spec.ts`
- Create: `tests/load/thirty-player-mmo-foundation.ts`
- Create: `docs/reports/mmorpg/foundation-handoff.md`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Adds scripts `test:mmo:foundation` and `test:load:mmo:foundation`.
- Produces a structured load result containing admitted, rejected, duplicateLeaseCount, reconnectSuccessRate, p95CommandAckMs, p99CommandAckMs, and maxPopulation.

- [ ] **Step 1: Write the failing end-to-end journey**

Cover authenticated eligible automatic entry, ineligible legacy fallback, protocol mismatch, 30-player admission, 31st-player rejection, refresh reconnect, injected room failure recovery, checkpoint restoration, feature-flag disable, and immediate legacy availability.

- [ ] **Step 2: Add the 30-player diagnostic load script**

Connect 30 unique authenticated test accounts, send bounded cardinal movement for five minutes, inject five reconnects, attempt one duplicate account connection and one 31st account, then emit the exact structured fields above. Fail on population above 30, duplicate lease, reconnect below 99.5%, or p95 command acknowledgement above 150 ms in the controlled local environment.

- [ ] **Step 3: Run the complete foundation gate**

Run: `npm run typecheck && npm run lint && npm run test:mmo:foundation && npm run test:load:mmo:foundation && npm run build`

Expected: all commands PASS; duplicate lease count `0`; max population `30`; the 31st account is rejected safely; legacy entry remains usable.

- [ ] **Step 4: Perform required mobile browser checks**

Run the Playwright journey at `390x844`, `412x915`, `740x360`, and landscape rotations. Assert no horizontal page overflow, no safe-area collision, all primary targets at least 44 CSS px, status announcements present, and recovery controls visible without browser zoom.

- [ ] **Step 5: Write the evidence report**

Record commit IDs, protocol `4`, migration `20260804000100`, exact commands, load JSON, tested viewports, failures injected, observed recovery times, known defects, and feature-flag rollback steps in `docs/reports/mmorpg/foundation-handoff.md`.

- [ ] **Step 6: Commit**

```text
git add tests/e2e/mmo-foundation.spec.ts tests/load/thirty-player-mmo-foundation.ts docs/reports/mmorpg/foundation-handoff.md package.json .env.example
git commit -m "test: verify MMO foundation rollout gate"
```

## Foundation Completion Gate

The foundation is complete only when Tasks 1–8 are committed, the full gate command passes, the database migration remains additive, automatic entry is disabled by default, protocol-v3 legacy play remains functional, duplicate memberships remain zero, and the handoff report contains reproducible evidence. Failure of any requirement blocks Phase 2 rollout but does not require removing safely isolated foundation code.
