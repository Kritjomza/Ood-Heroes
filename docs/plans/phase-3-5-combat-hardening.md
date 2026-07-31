# Odd Tower Phase 3.5 Combat Hardening Implementation Plan

> **Execution:** Work inline with red/green/refactor TDD. Do not execute Git commands.

**Goal:** Sustain at least 19 Hz with ten players and fifty active monsters while adding bounded collision-aware navigation, deterministic wandering, missing combat browser coverage, and a readable cute-cartoon combat presentation.

**Architecture:** Keep one room-owned authoritative fixed-step simulation. Split 20 Hz movement/combat from 5 Hz decisions and at-most-2 Hz path search, use a deterministic spatial grid for nearby dynamic entities, and project only changed schema fields. Keep Phaser responsible for pooled world presentation and React responsible for meaningful HUD state changes.

**Tech stack:** strict TypeScript 5.9, React 19, Phaser 3.90, Vite 8, Colyseus 0.17/schema 4, Vitest 3, Testing Library, Playwright 1.55.

## Global constraints

- Never execute a Git command and never inspect or modify `.git`.
- Preserve Phase 1 local play, Phase 2 movement/prediction/interpolation/reconnection, and Phase 3 shared-combat authority/reward semantics.
- Movement, cooldowns, attacks, effects, and healing use a 50 ms fixed step; AI decisions use four-tick cadence; wandering uses at least twenty ticks; per-entity A\* uses at least ten ticks between searches.
- Catch-up is bounded to two fixed steps per room callback; excess accumulated time is recorded as skipped work rather than allowed to spiral.
- Do not add per-monster intervals, unbounded collections, persistence, accounts, databases, inventory, summoning, bosses, later floors, or other Phase 4+ systems.
- All test controls are enabled only when `ODD_TOWER_TEST_MODE=1`.
- UI touch targets are at least 48 CSS px, respect safe-area insets, expose text as well as color, and honor `prefers-reduced-motion`.

## Baseline profile (2026-07-30)

- Clean install: 575 packages; production audit to be rerun at final verification.
- Format, ESLint, strict TypeScript, and production build: passed.
- Vitest: 108/108 passed in 20 files.
- Coverage: 92.38% statements/lines, 86.96% branches, 91.22% functions.
- Playwright: 16/16 passed; measured 33.6 FPS desktop and 60.5 FPS at 915x412 emulation.
- Focused multiplayer: 77/77 Vitest plus 4/4 Chromium; focused combat: 47/47 plus 2/2 Chromium.
- Movement load: 10 clients, 9,542 commands, 3 ms average latency, 19.50 MB embedded-process heap delta, zero invalid rejection/disconnect/error, cleanup passed.
- Combat load: 10 clients, 50 monsters, 60.502 s, 960/1,200 ticks, 15.87 Hz, 80.0% tick rate, 89 kills, 77 respawns, 250 rewards, 9 ms latency, 21.33 MB heap delta, zero duplicate reward IDs/disconnects/rejections/errors, cleanup passed.
- A short CPU sample showed a largely idle event loop rather than CPU saturation. The first-order throughput fault is timer drift without fixed-step compensation. Code inspection found additional repeated work that reduces headroom: AI target acquisition every tick, repeated full-room sorts, full combat projection every tick, status-effect schema clear/recreate, and scanning all retained events every tick.

## File structure

- Create `apps/game-server/src/simulation/FixedStepScheduler.ts`: bounded accumulator and late/skipped-step metrics.
- Create `apps/game-server/src/simulation/SpatialGrid.ts`: deterministic insert/update/remove/radius query/clear.
- Create `apps/game-server/src/simulation/MonsterNavigator.ts`: direct travel, progress tracking, four-way A\* fallback, path cache, failures, blacklist, and deterministic wander state.
- Create `apps/game-server/src/simulation/SimulationMetrics.ts`: rolling tick durations and bounded aggregate counters.
- Modify `apps/game-server/src/simulation/CombatSimulation.ts`: split decisions from execution, integrate grid/navigation/wander/metrics, expose incremental events and cleanup.
- Modify `apps/game-server/src/rooms/FloorOneRoom.ts`: bounded fixed-step scheduling, change-aware schema projection, incremental event publication, test-only control messages, cleanup, and structured metrics.
- Modify `packages/game-core/src/combat-config.ts`: typed hardening cadence/navigation/grid constants.
- Modify `packages/game-core/src/navigation.ts`: bounded deterministic A\* options for safe-zone/leash constraints.
- Modify protocol types/validation only for presentation fields and gated test controls required by observable E2E.
- Create focused scheduler/grid/navigation tests and extend combat/room/sustained tests.
- Split `apps/client/src/ui/OnlineHud.tsx` into `OnlineCombatHud`, `TeamStatusPanel`, `RoomStatusCard`, `CombatStatusBubble`, `AutoHuntButton`, `SessionRewardBadge`, and `RespawnOverlay` under `apps/client/src/ui/online/`.
- Create `apps/client/src/ui/online/copy.ts` and `tokens.css` for centralized strings and visual tokens.
- Modify `MultiplayerBridge.ts`/`MultiplayerClient.ts` so semantically unchanged snapshots do not notify React and reconnect always returns to manual control.
- Modify `MultiplayerScene.ts` to own hero HP bars, telegraphs, pooled effects, target markers, and deterministic diagnostics/cleanup.
- Modify `Joystick.tsx`, `App.tsx`, and `styles.css` for responsive placement, portrait hint, accessible interaction, and reduced motion.
- Extend component and Playwright coverage; add hardening load scripts and documentation.

## Performance design

1. `FixedStepScheduler.advance(elapsedMs)` accumulates real elapsed time and returns 0-2 fixed steps. It records late callbacks and skipped excess steps. No unbounded catch-up loop is possible.
2. Each fixed step retains existing authoritative ordering. Monster decision slots are staggered by monster index and execute every fourth tick; path searches are separately gated every tenth tick.
3. A 160 px spatial grid indexes heroes and living monsters. Queries inspect only intersecting neighboring buckets and sort results by squared distance then stable ID. Removal, respawn, reconnect, and room disposal update or clear membership.
4. The simulation publishes only events created since the prior room tick. Event history remains capped at 128 and published-ID dedupe remains capped at 256.
5. Projection compares primitive fields before assignment. Hero effect arrays are rebuilt only when their serialized signature changes. Schema object identities remain stable.
6. `SimulationMetrics` retains at most 256 tick durations and aggregates all other counters. Metrics are test-readable but are never placed in normal client schema or production logs.

## Navigation design

- Direct cardinal pursuit remains the default when the next step progresses toward the goal.
- A monster records its last progress position/tick. Less than four pixels of progress for twelve ticks marks it stuck.
- Stuck pursuit requests deterministic four-way A\* from the shared 64x64 collision grid. Search excludes Safe Zone tiles, nodes outside the monster leash, and stops after a configured node budget.
- Cached world-space waypoints are followed at 20 Hz. A path is not recalculated sooner than ten ticks, and is cleared on target invalidation/death/safe-zone entry, monster death/respawn, repeated failure, or disposal.
- Three failures blacklist that target for 100 ticks. Failure state is bounded per monster and causes another target search or a safe return to spawn.
- Idle monsters make staggered seeded wander decisions every 20-60 ticks, choose walkable destinations within 96 px of spawn/leash and outside the Safe Zone, and pause without timers. Aggro cancels wandering immediately.
- Auto Hunt reuses the same constrained path service and bounded blacklist while preserving its existing state machine and retreat thresholds.

## UI design

- Palette uses cream, peach, pink, yellow, mint, sky, lavender, chocolate, ink, danger, and success tokens with high-contrast outlines.
- The top-left team sticker has three compact role rows, face glyphs, levels, capsule HP bars, and explicit defeated/slow/reviving text.
- A top-center speech bubble presents centralized authoritative status copy; the room sticker moves to top-right; session rewards sit in a small bottom-center sticker.
- Auto Hunt is a 56 px squishy action button with distinct off/on/retreat/recover/wait labels and accessible pressed state. The joystick remains bottom-left and gains a candy knob without overlapping actions.
- Team wipe uses a lightly dimmed, playful but explicit countdown overlay. Connection/error changes use polite/assertive live regions.
- Phaser adds persistent hero HP bars and reuses a small effect pool for hit flash, defeat/respawn, heal, slow, charge warning/impact, and Auto Hunt marker. No effect changes authoritative timing.
- At 915x412, 844x390, and 740x360 the team/room cards compact vertically, the speech bubble stays clear of combat center, and action clusters remain separated. Portrait shows an orientation hint while retaining usable controls.

## TDD tasks

### Task 1: Fixed-step scheduler and metrics

- Write failing tests for 20 Hz cadence, two-step catch-up cap, skipped-step accounting, 5 Hz decision slots, 1 Hz wander slots, 2 Hz path gates, rolling percentiles, and cleanup.
- Implement the scheduler/metrics and verify focused failures turn green before integrating them into `FloorOneRoom`.
- Run the short hardening load to establish instrumented pre-optimization durations.

### Task 2: Spatial grid

- Write failing tests for same/neighbor cells, boundaries, deterministic ordering, movement between cells, removal, duplicate prevention, and clear.
- Implement the 160 px grid and integrate hero/monster membership with lifecycle cleanup.

### Task 3: Monster navigation and wandering

- Write failing tests for direct pursuit without A\*, wall routing, four-way paths, safe-zone/leash exclusion, unreachable failure/expiry, progress/stuck reset, target/death/respawn clearing, seeded wander, radius bounds, and aggro cancellation.
- Implement `MonsterNavigator`, then integrate it behind existing combat behavior while preserving ability timing.

### Task 4: AI cadence, targeting, Auto Hunt, and cleanup

- Write failing cadence and transition tests proving acquisition/heal/charge/wander decisions run only on due ticks while attacks/effects/death continue every fixed step.
- Replace full-room acquisition with spatial queries, reuse cached Auto Hunt paths, and bound every blacklist/cache/ledger.
- Add disposal tests proving events, grids, paths, contributions, and per-player structures clear.

### Task 5: Projection and event efficiency

- Write failing room tests that count primitive schema writes, effect rebuilds, event publications, and unchanged projections.
- Add change-aware assignment and incremental event draining without changing durable schema truth.

### Task 6: React HUD state and cartoon components

- Write failing component tests for centralized copy, status states, gold pop key, respawn countdown, temporary notice, slow/defeated text, accessible labels/live regions, reduced motion, mobile classes, and subscription cleanup.
- Implement focused components/tokens and semantic bridge equality so unchanged server patches do not rerender the HUD.

### Task 7: Phaser combat presentation

- Add failing view-model/effect-pool tests where possible and observable browser diagnostics for hero bars, telegraphs, effect bounds, tap targeting, and cleanup.
- Implement persistent world UI and bounded event-driven effects; destroy all owned objects on entity removal or scene shutdown.

### Task 8: Deterministic browser edge cases

- Add gated controls and observable waits for retreat/recovery, wipe/respawn, active-combat reconnect, mobile joystick/tap focus, leave during death, and wall navigation/unreachable abandonment.
- Add cute-HUD/responsive checks at 915x412, 844x390, and 740x360 plus one-canvas and console-error assertions.

### Task 9: Load, sustained simulation, scripts, and docs

- Extend load output with expected/executed ticks, Hz/percentage, p50/p95/p99/max, late ticks, AI decisions, queries, paths, latency, heap, cleanup, kills/respawns/rewards/errors.
- Extend sustained results with charges/heals/slows/paths/stuck recovery/unreachable failures/state bounds.
- Add `test:hardening`, `test:load:hardening`, and equivalent required scripts.
- Update README, Phase 3 handoff addendum, and `docs/phase-3-5-handoff.md` with measured before/after evidence and explicit Phase 4 gate.

## Regression and verification

- Run focused red/green tests after every task, then format, lint, typecheck, full Vitest, coverage, production build, full Playwright, focused multiplayer/combat/hardening, movement/combat/hardening loads, sustained simulation, and production audit.
- Start the compiled server and verify `/health`; start the built preview and inspect desktop plus the three mobile landscape sizes; stop all processes and verify ports 2567/4173 are released.
- Phase 4 is READY only when the 60-second maximum load executes at least 1,140 ticks at 19 Hz, all specified browser edge cases and regressions pass, and duplicate rewards/disconnects/rejections/server errors are all zero.

## Plan self-review

- No placeholder, per-entity timer, unbounded collection, per-tick A\*, Phase 4 feature, or contradictory cadence remains.
- Every mutable structure has a removal/respawn/disposal path and a test.
- Server authority and session-only progression remain unchanged.
- The UI layout preserves the combat center, touch target size, safe areas, text alternatives, and reduced-motion behavior.
- The plan uses no Git step; the project’s absolute Git prohibition overrides generic skill instructions.
