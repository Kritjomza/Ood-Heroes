# Phase 3 Shared World Combat Handoff

## Implemented Functionality

Odd Tower now has an independent **Local Prototype** and an **Online Shared Combat Sandbox**. An online Floor 1 room holds one to ten player sessions and 34–50 shared monsters. The server owns monster spawning/movement/AI, three-hero combat state, attacks, damage, status effects, focus validation, Auto Hunt movement, Safe Zone recovery, individual revival, team wipe/respawn, contributions, Session Gold, Session EXP, leveling, monster death/respawn, reconnect protection, and cleanup.

The five definitions are Grumpy Radish, Jumping Sauce Bag, Shoe-Biting Dust Ball, Wild Sausage, and Lost Pudding. Dust Ball refreshes a non-stacking 20% two-second slow. Sausage emits a 750 ms warning, locks a cardinal charge, respects shared collision, and tracks a hit-once set. Pudding finds the lowest-ratio injured living monster in 120 px every three seconds and heals it before attacking.

## Authority Boundaries and Protocol

- `game-core` owns definitions, seeded RNG, safe damage, formation-derived positions, deterministic targeting, contribution eligibility, reward identity, effect timing, progression, Safe Zone geometry, collision, and cardinal A\*.
- `network-protocol` is transport-neutral protocol version 3. Clients may send movement/heartbeat, `focus-target`, or `auto-hunt`; validation rejects malformed shapes, non-finite numbers, non-booleans, unknown events, and invalid IDs.
- `CombatSimulation` is room-owned. Internal paths, RNG, contributions, processed reward keys, charge hit sets, and Auto Hunt blacklists are not serialized.
- Colyseus schema is durable truth for anchors, heroes, monsters, progression, targets, Auto Hunt, and respawn tick. Bounded ephemeral events are broadcast and validated/deduplicated by clients.
- Phaser presents world state; React presents meaningful HUD state. Neither calculates authoritative outcomes.

## Tick Ordering and Rates

The room runs one controlled 20 Hz / 50 ms simulation interval and a 20 Hz patch rate. Each tick processes authoritative movement, wipe state, expired effects, Auto Hunt movement, monster AI/movement/specials, hero attacks, Safe Zone healing/revival, and monster respawns, then projects schema and publishes unseen events. Auto Hunt paths refresh at most twice per second.

Damage is `floor(max(1, attack - defense × 0.5) × seededMultiplier)`, with a multiplier in `[0.90, 1.10]`. Non-finite combat inputs safely produce no damage.

## Monster Spawning and AI

The deterministic base population is 34: 13 Radishes, 4 Sauce Bags, 7 Dust Balls, 4 Sausages, and 6 Puddings. Joining players add two slots after the first player, capped at 50. Spawn positions are walkable and outside the Safe Zone. Stable IDs are `spawn-N`; `spawnGeneration` increments on respawn. Returning monsters regenerate 10% max HP per second.

Network AI states are `idle`, `wandering`, `chasing`, `attacking`, `windup`, `charging`, `healing`, `returning`, `defeated`, and `respawning`. Free-form idle wandering remains stationary until aggro; this is a known limitation.

## Auto Hunt, Safe Zone, and Respawn

Auto Hunt states are `disabled`, `acquiring-target`, `navigating`, `engaging`, `retreating`, `recovering`, and `waiting`. The server chooses the nearest living non-blacklisted target and paths the Team Anchor. Non-idle manual movement disables it immediately. Unreachable targets use a bounded eight-entry five-second blacklist.

Below 25% combined living-team HP, Auto Hunt retreats. In the Safe Zone, living heroes heal 10% max HP per second and hunting resumes at 80%. A defeated hero revives at 50% HP after five uninterrupted safe seconds when another hero lives. A team wipe starts a 100-tick countdown, disables movement/Auto Hunt, clears targets/effects, and respawns the team at full HP while preserving session progression.

## Contributions, Rewards, and Idempotency

Confirmed hero damage aggregates by player and monster generation. Eligibility requires `max(1, floor(maxHp × 0.01))` damage within 200 ticks of death; no final hit is required. Eligible players receive Gold. Living heroes receive full EXP and defeated heroes half. The existing curve and rounded +10% HP/+8% Attack/+6% Defense growth support multiple levels through level 20.

Reward identity is `roomId:monsterId:spawnGeneration`. Processed `(rewardIdentity, playerId)` keys prevent duplicate application. Disconnect holds preserve state during the grace period while disabling attacks and Auto Hunt.

All progression is temporary and the HUD labels `Session Gold`, `Session Level`, and `Session EXP`.

## Important Files

- `packages/game-core/src/combat-config.ts`, `combat.ts`
- `packages/network-protocol/src/types.ts`, `validation.ts`, `config.ts`
- `apps/game-server/src/simulation/CombatSimulation.ts`
- `apps/game-server/src/schema/RoomState.ts`
- `apps/game-server/src/rooms/FloorOneRoom.ts`
- `apps/client/src/game/multiplayer/MultiplayerClient.ts`, `combatEvents.ts`
- `apps/client/src/game/scenes/MultiplayerScene.ts`
- `apps/client/src/ui/OnlineHud.tsx`
- `tests/load/ten-player-shared-combat.ts`

## Verification Evidence

The untouched Phase 2 baseline passed 83/83 tests at 90.03% statement/line coverage, 12/12 desktop/mobile E2E scenarios, 57/57 focused multiplayer tests plus 4/4 Chromium scenarios, and a 60.474-second movement load with 9,730 commands, 2 ms latency, zero rejected traffic/disconnects/server errors, ~5.91 MB heap growth, and cleanup.

Phase 3 final verification:

- Accelerated ten-minute simulation: 12,000 ticks, 36 monsters, 30 kills, 30 respawns, 47 reward grants, and 128 retained events.
- Real two-client schema tests prove identical monster IDs and authoritative focus/Auto Hunt state.
- Chromium combat smoke proves authoritative monster rendering and server Auto Hunt.
- The full suite passed 108/108 tests at 92.38% statement/line, 86.96% branch, and 91.22% function coverage; all 16 desktop/mobile browser scenarios and all 77 focused multiplayer tests plus four Chromium scenarios passed.
- A full ten-player combat run exercised the 50-monster cap for 60.561 seconds: 108 kills, 94 respawns, 278 reward grants, zero duplicate reward IDs, 13 ms average local latency, zero disconnects/rejected valid commands/server errors, and clean teardown.
- The compiled server health endpoint and built client preview both returned HTTP 200.

## Performance and Known Limitations

Hot collections are bounded: 50 monsters, 30 heroes, 128 server events, 256 published/client event IDs, eight Auto Hunt blacklist entries/player, and generation-scoped contributions. There is one room interval and no per-monster timer.

The embedded ten-client/server Node process executed 972 of 1,200 expected ticks during the final 60-second, 50-monster load (about 16.2 Hz rather than the configured 20 Hz) and grew the heap by about 15.19 MB. This is a genuine performance limitation. Monster target decisions currently run on each simulation tick, and ordinary pursuit uses direct collision-aware cardinal stepping rather than cached A\* fallback, so monsters can stall behind walls. Idle monsters do not free-wander. Phaser does not yet present all requested combat telegraphs/effects or world-space hero HP bars. Browser automation covers shared rendering/Auto Hunt and contribution rewards, while forced retreat/recovery, wipe, combat reconnection, special-behavior visuals, and full mobile monster-tap interaction remain deterministic/integration checks or untested UI scenarios. Physical mid-range mobile hardware is unprofiled.

## Phase 4 Persistence Starting Point

Add authentication and a repository/service boundary after authoritative reward finalization. Persist the existing reward identity plus authenticated player ID in one PostgreSQL transaction with currency/progression changes. Load collection/team data only on join; keep live combat, contributions, eligibility, and client commands unchanged. Supabase Auth, PostgreSQL, hero collection, summoning, shards, currency persistence, and AFK rewards are not implemented in Phase 3.

## Phase 3.5 Addendum (2026-07-30)

Phase 3.5 supersedes the performance and presentation limitations recorded above without erasing the historical Phase 3 measurements. The room now uses a bounded fixed-step scheduler, 5 Hz expensive AI decisions, 1 Hz wander decisions, a deterministic 160 px spatial grid, collision-aware A\* fallback with stuck recovery, change-aware schema projection, incremental bounded events, and generation cleanup. The online HUD and Phaser combat presentation were redesigned for cartoon readability and mobile landscape.

The final ten-client/fifty-monster hardening load reached 1,200/1,200 ticks (20.0 Hz), and the complete 26-scenario browser matrix passed. See `docs/phase-3-5-handoff.md` for the design, measured results, remaining limitations, and Phase 4 readiness decision.
