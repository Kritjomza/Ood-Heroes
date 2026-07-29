# Phase 1 Handoff

## Implemented

The local slice includes a 2048×2048 programmatic floor, central healing Safe Zone, three readable farming regions, collision walls, 18 reachable training monsters, one Team Anchor and three visible formation members. Keyboard/touch cardinal movement, smoothed bounded camera follow, automatic reciprocal combat, independent EXP/level growth, monster respawn, five-second team respawn, pause/visibility handling, focus targeting, and Auto Hunt with throttled cardinal A\* are wired into the playable scene.

Auto Hunt selects reachable monsters, navigates to combat range, chains targets, waits without busy-looping when none exist, retreats below 25% living HP, recovers to 80%, and is cancelled immediately by manual input. The HUD exposes leader HP/EXP/level, team count, target, state, position, FPS, respawn, pause, and accessible controls.

## Boundaries and responsibilities

- `packages/game-core/src/config.ts`: all Phase 1 tuning.
- `packages/game-core/src/rules.ts`: deterministic combat, progression, formation, Auto Hunt, and monster transitions. Stat growth uses `Math.round`; damage uses `Math.floor`.
- `packages/game-core/src/navigation.ts`: deterministic four-neighbor A\*.
- `packages/game-core/src/map.ts`: the 64×64 walkability grid, Safe Zone, and spawn locations.
- `apps/client/src/game/scenes/GameScene.ts`: Phaser objects, Arcade collision, inputs, camera, visual interpolation/effects, and real-time orchestration.
- `apps/client/src/game/bridge.ts`: typed low-frequency Phaser-to-React snapshots.
- `apps/client/src/ui`: responsive HUD, pointer joystick, and error boundary.

## Editing and extension

Replace runtime shapes in `GameScene.makeTextures`, `createHeroes`, and `createMonsters` with loaded assets while retaining entity IDs, bodies, and simulation state. Edit walls and regions in `map.ts`; all A\* and collision consumers share that data. Keep future multiplayer transport outside `game-core`: move time stepping and authoritative entity state to a server, serialize typed inputs/snapshots at an adapter boundary, and retain Phaser interpolation plus React HUD subscriptions on the client.

## Known limitations

The prototype uses simple pursuit steering for nearby monsters; A\* is reserved for Auto Hunt. Followers are visual/non-blocking and safely snap after severe separation. Balance has not been validated on physical mid-range mobile hardware. No Phase 2 systems are stubbed or claimed.

## Verification evidence

See the completion report for the final command exits and manual browser observations. Automated suites cover deterministic rules, HUD behavior/cleanup, one-canvas lifecycle, keyboard movement, Auto Hunt cancellation, and mobile control layout.

## Phase 2 starting point

First introduce a transport-neutral command/snapshot schema beside `game-core`, then run the existing deterministic rules in a server tick while the client predicts only Team Anchor movement. Add reconciliation and interpolation before shared monsters; persistence and accounts should remain a separate later concern.
