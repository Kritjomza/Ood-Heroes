# Floor 1 Map and Playable-MVP Implementation Report

## Outcome

Floor 1 now has a typed, Tiled-compatible 64×64 definition using 32 px tiles (2048×2048 world). Rendering, authoritative collision, weighted navigation, slow terrain, monster placement, boss objects, and portal placement derive from that definition.

## Required layers

`Ground_Base`, `Ground_Detail`, `Terrain_Slow`, `Decor_Below`, `Collision`, `Gameplay_Objects`, `Monster_Spawns`, `Boss_Objects`, `Portal_Objects`, `Decor_Above`, `Occlusion`, and `Debug` are present and validated in order.

## Playable flow

- The camp is the safe starting area with exits and landmarks.
- Shared collision data drives client movement, server movement, and navigation-grid blocking.
- Slow terrain contributes weighted A* cost and a matching movement multiplier.
- Normal-monster rewards advance per-player Floor 1 progress to a capped eligibility threshold.
- The shared guardian supports locked, available, active, and defeated phases; scheduled frontal, cold-zone, add, and enrage behavior; contribution eligibility; and reset behavior.
- The portal remains sealed until guardian defeat and requires an explicit nearby interaction (`E`) to complete the floor.
- Completion/reward application is idempotent per player within the authoritative room simulation (500 gold and 100 gems).

## Verification results

- Typed map, reachability, weighted navigation, terrain, guardian, and progression unit suites passed.
- Focused authoritative server suite passed: 17/17.
- Broader server run reached 76 passed, 3 skipped, with one obsolete collision-coordinate assertion; that fixture was updated to the rebuilt shared map and its focused rerun passed.
- Typecheck, lint, server build, and client production build passed.
- Direct browser launch reached the authentication screen. The repository E2E wrapper then stopped because local Supabase was not running, so authenticated canvas/boss/portal browser traversal was not completed in this environment.

## Limitations and risks

- Completion idempotency and guardian state are room-memory authoritative but are not yet written through the Supabase persistence service; a room restart loses them.
- Authenticated browser QA requires the local Supabase stack and `.env.local` configuration.
- Final Floor 1 art is represented by procedural biome/landmark/fallback rendering until the audited WebPs are supplied.
- Final tuning of boss telegraphs, collision shapes, terrain costs, and spawn density needs hands-on playtesting with final art.
