# Phase 3.5 Shared Combat Hardening Handoff

## Result and Phase 4 Gate

Phase 3.5 is complete. The final ten-client, fifty-monster hardening load executed 1,200 of 1,200 expected ticks in 60 seconds (20.0 Hz, 100%), with no skipped simulation steps, duplicate rewards, unexpected disconnects, rejected valid commands, or server errors. Cleanup passed. The full 26-scenario desktop/mobile browser matrix and all 127 unit/integration tests passed.

**Phase 4 readiness: READY.** This decision covers the technical foundation only. Phase 4 persistence, identity, economies, collections, and account systems remain intentionally unimplemented.

## Baseline and Bottlenecks

Before Phase 3.5, the repository passed 108 tests, 16 browser scenarios, 77 focused multiplayer tests plus four Chromium scenarios, and 47 focused combat tests plus two Chromium scenarios. Coverage was 92.38% statements/lines, 86.96% branches, and 91.22% functions. The prior maximum combat run delivered 972 of 1,200 ticks (about 16.2 Hz).

Profiling showed that the process was not CPU-saturated. The largest problem was interval drift combined with one-step-per-callback scheduling. Repeated full-room target scans, per-tick expensive AI decisions, full schema assignments, event-history rescans, and avoidable React notifications added work and allocation pressure.

## Performance Architecture

- A bounded fixed-step accumulator preserves 50 ms simulation time, performs at most two catch-up steps, and records late callbacks and skipped work.
- Movement, cooldowns, attacks, effects, healing, and respawns remain at 20 Hz.
- Expensive monster decisions are scheduled every four ticks (5 Hz). Wander decisions occur every twenty ticks (1 Hz). Per-monster path recalculation is limited to once per ten ticks (2 Hz).
- A deterministic 160 px spatial grid indexes live monsters and hero formation positions. It supports stable radius queries, cell migration, removal, and complete disposal.
- Hero attack acquisition, monster aggro, charge hit candidates, and other nearby checks use bounded spatial queries instead of repeated room-wide scans where proximity is relevant.
- Schema projection assigns changed primitive fields only. Status-effect arrays rebuild only when their stable signature changes.
- Combat events are delivered incrementally. History and undrained delivery queues are each capped at 128. Metrics count created, removed, and retained events.
- Contribution maps clear on respawn; disconnected players are removed from ledgers; expired generation reward keys are pruned at respawn.
- Room diagnostics use a rolling 256-duration window and aggregate counters. Test-only structured endpoints exist only when `ODD_TOWER_TEST_MODE=1`.

## Navigation, Wander, and Cleanup

Monsters first use collision-aware cardinal pursuit. A `StuckTracker` detects less than four pixels of progress over twelve ticks. A blocked monster requests deterministic four-direction A\* on the shared collision grid, excluding the Safe Zone and tiles outside its leash. Paths are followed one waypoint at a time and recalculated at most twice per second.

Three consecutive failures temporarily blacklist the target. The monster then selects another valid target or returns toward spawn without busy-looping. Paths, failure state, charge hit sets, and wander targets clear on target invalidation, death, respawn, and room disposal.

Idle monsters choose seeded, walkable destinations once per second at most, within 96 px of spawn and within leash constraints. Aggro cancels wander immediately. There are no per-monster timers.

## Cute Cartoon UI and Combat Feedback

The online HUD is split into focused React components for team status, combat copy, Auto Hunt, room status, session rewards, and respawn. Central tokens define cream, peach, pink, yellow, mint, sky, lavender, chocolate, ink, danger, and success colors; a 20 px squishy radius; sticker shadow; 180 ms pop motion; and HUD/overlay layers.

The layout uses sticker-like bordered panels, rounded 48 px minimum controls, accessible status regions, explicit text alongside colors, visible focus states, safe-area insets, a portrait orientation hint, and `prefers-reduced-motion` overrides. Copy is centralized and keeps critical meaning alongside jokes.

Phaser now renders persistent world-space HP bars for all three heroes per team, monster HP bars and focus/Auto Hunt rings, charge lanes, hit flashes, defeat and respawn pops, heal/slow presentation effects, and a capped pool of 32 reusable effect objects. React publishes only when semantic visible state changes.

Mobile landscape was browser-tested at 915x412, 844x390, and 740x360. Joystick, Auto Hunt, team, and room panels did not overlap; touch targets remained at least 48 px; the page did not scroll.

## Browser Edge Cases

The final Playwright matrix passed 26/26 scenarios across Chromium desktop and mobile landscape:

- Auto Hunt retreat, Safe Zone recovery, and automatic resume: passed.
- Full team wipe, readable five-second overlay, respawn, and manual mode: passed.
- Active-combat network loss, same-session reconnect, no duplicate player, and Auto Hunt reset: passed.
- Mobile touch targeting and responsive HUD at three landscape sizes: passed.
- Consented leave during lethal resolution with exactly one remaining reward: passed.
- Wall-blocked monster activates A\* and routes around the obstacle: passed.
- Existing local prototype, room lifecycle, prediction, interpolation, combat, contribution reward, reload, and one-canvas scenarios: passed.
- Recurring console errors: none. The SDK emits one expected warning when the reconnect test deliberately takes the browser offline.

Measured browser render cadence was 34.4 FPS in desktop Chromium and 60.5 FPS in the mobile-emulated project. Physical mobile hardware was not available and is recorded as not tested.

## Maximum-Load Results

The final `test:load:hardening` run used ten real clients, fifty active monsters, focus commands, Auto Hunt, manual movement traffic, all five monster definitions, deaths, respawns, and rewards for 60 seconds.

| Metric                                                |                           Result |
| ----------------------------------------------------- | -------------------------------: |
| Expected / executed ticks                             |                    1,200 / 1,200 |
| Effective rate / percentage                           |                   20.0 Hz / 100% |
| Average / p50 / p95 / p99 tick work                   | 0.827 / 0.718 / 1.650 / 2.685 ms |
| Maximum tick work                                     |                        16.881 ms |
| Late simulation ticks / skipped steps                 |                            0 / 0 |
| Players / peak monsters / commands                    |                  10 / 50 / 1,120 |
| AI decisions / nearby queries / paths                 |              13,361 / 28,197 / 0 |
| Kills / respawns / rewards                            |                    68 / 63 / 170 |
| Charges / heals                                       |                          14 / 62 |
| Duplicate rewards / disconnects / rejections / errors |                    0 / 0 / 0 / 0 |
| Average latency                                       |                            12 ms |
| Heap delta                                            |     23,826,176 bytes (22.72 MiB) |
| Retained / pending events                             |                          128 / 0 |
| Contribution / path-cache entries                     |                           29 / 0 |
| Cleanup                                               |                           passed |

The separate `test:load:combat` run also executed 1,200/1,200 ticks at 20.0 Hz, with p95 1.725 ms, 78 kills, 72 respawns, 243 rewards, and all failure counters at zero. A zero path count in these open-field load runs is expected; deterministic wall and sustained scenarios exercise A\* directly.

## Sustained Combat Results

The accelerated ten-minute test simulated 12,000 ticks with two Auto Hunt players and all five monster types. It recorded 13 kills, 13 respawns, 15 rewards, 10 charge hits, 263 heals, 6 slows, 18 path calculations, 11 stuck recoveries, and 7 safely handled unreachable failures. Duplicate event identities were zero.

State remained bounded at 36 monsters, 128 retained events, 128 undrained test events, zero old reward keys, four contribution entries, zero cached path nodes at completion, and 42 spatial entries. Disposal behavior is covered by unit/integration tests; live load room cleanup passed.

## Verification Summary

- `npm ci`: passed; 575 packages installed.
- `npm run format:check`: passed after formatting the Phase 3.5 files.
- `npm run lint`: passed with zero errors.
- `npm run typecheck`: passed under strict TypeScript.
- `npm test -- --run`: 127/127 passed across 24 files.
- `npm run test:coverage`: 127/127 passed; 92.20% statements/lines, 88.45% branches, 89.71% functions.
- `npm run build`: passed; client bundle 1,546.53 kB minified, 428.13 kB gzip (large-chunk warning remains).
- `npm run test:e2e`: 26/26 passed.
- `npm run test:multiplayer`: 96/96 plus 4/4 Chromium passed.
- `npm run test:combat`: 53/53 plus 2/2 Chromium passed.
- `npm run test:hardening`: 33/33 plus 5/5 Chromium passed.
- `npm run test:load`: passed with ten clients, 9,669 commands, no failures, 5 ms latency, and cleanup.
- `npm run test:load:combat`: passed at 20.0 Hz.
- `npm run test:load:hardening`: passed at 20.0 Hz.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Compiled server `/health`: HTTP 200. Built preview: HTTP 200. Ports 2567 and 4173 released after shutdown.

## Manual Checklist and Limitations

Browser-observable performance, navigation around a wall, wander/aggro state, retreat/recovery, wipe/respawn, reconnect, leave-during-death, combat readability, mobile layout, reduced-motion CSS, room lifecycle, and one-canvas cleanup are passed through deterministic browser or integration verification. Safe Zone avoidance, leash limits, unreachable failure, spatial cleanup, and path clearing are passed through deterministic unit/integration verification. No recurring server-log spam or recurring browser-console error was observed.

Physical mid-range mobile testing is not tested. Phaser still uses lightweight geometric prototype artwork rather than final production sprites. The production client has a 500 kB chunk-size warning and would benefit from later code splitting. Development-only dependency audit findings remain outside `npm audit --omit=dev` and were not auto-upgraded because that could introduce unrelated breaking changes.

Accounts, authentication, databases, persistent Gold/EXP, collection, summoning, shards, inventory, equipment, AFK rewards, bosses, portals, PvP, chat, guilds, trading, rebirth, later floors, monetization, and final art are Phase 4+ exclusions.
