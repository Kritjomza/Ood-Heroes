# Phase 2 Handoff

## Implemented functionality

Phase 1 remains an independent **Local Prototype**. The new **Online Movement Sandbox** supports 1–10 temporary players in isolated Floor 1 rooms. A player can create a room, share its six-character code, join an exact existing code, move a visible three-member team, see remote teams move, leave cleanly, and reconnect to the same session during a transient interruption.

Online position is server-authoritative. Clients send only validated move/heartbeat intent. Shared deterministic movement enforces cardinal motion, obstacle collision, player-radius world bounds, and safe-zone spawns. Players do not block one another. Online mode runs no monster, combat, progression, reward, or persistence system.

## Architecture and ownership

- `packages/game-core` remains framework-free. `movement.ts` is the single cardinal movement/collision implementation used by server simulation and local prediction; the existing map and formation functions are also shared.
- `packages/network-protocol` owns protocol version 2, client commands, player/room/error types, typed network constants, room-code/display-name normalization, and strict finite-number/runtime validation. It contains no DOM, React, Phaser, or Colyseus room code.
- `apps/game-server` owns the Colyseus `floor_1` room, schema state, temporary sessions, latest accepted inputs, fixed ticks, acknowledgements, room metadata, reconnect reservations, per-client rate buckets, code registry, lobby HTTP routes, CORS, and health endpoint.
- The Phaser multiplayer layer owns input capture, visual prediction, reconciliation rendering, buffered remote interpolation, three-member team rendering, safe text rendering, camera follow, visibility stop, and entity cleanup.
- React owns mode/lobby/room UI, connection status, player count, room code, smoothed latency, reconnect/error overlays, clean leave, and mode transitions. It is not updated every Phaser frame.

## Networking model

- Server simulation: 20 Hz, fixed 50 ms steps
- Colyseus patch rate: 20 Hz
- Client input sampling: 20 Hz while moving, with immediate direction changes
- Idle heartbeat and latency sample: every 1 second
- Player speed: 120 pixels/second
- Stale-input stop: 500 ms
- Pending input limit: 64
- Remote interpolation delay: 100 ms
- Remote buffer limit: 20 snapshots per player
- Extrapolation: capped at 150 ms
- Reconnect grace period: 15 seconds
- Rate limit: token bucket refilling at 30 commands/second with a 10-command burst; five consecutive excess results escalate to disconnect

### Prediction and reconciliation

Every move/heartbeat uses one monotonic sequence. A move is applied immediately using the shared 50 ms movement rule and stored in the bounded pending queue. On authoritative state, the client removes sequences at or below `lastProcessedInputSequence`, resets to the server position, and deterministically replays the remaining moves. Errors below 4 pixels need no visible correction, corrections below 64 pixels are rendered smoothly, and larger/collision corrections snap. Reconnection clears stale inputs and starts at the returned authoritative acknowledgement/position.

### Remote interpolation

Snapshots are timestamped on receipt and sampled 100 ms in the past. The client linearly interpolates position between surrounding snapshots while retaining the earlier direction until the newer sample. If a future sample is absent, movement extrapolates for no more than 150 ms. Discontinuities over 64 pixels snap, buffers trim to 20 entries, and removed players immediately lose their buffer and rendered team.

## Room, identity, and reconnection behavior

`POST /rooms` creates one `floor_1` room and returns its ID/code. `GET /rooms/:code` normalizes an entered code and resolves only an active room; unknown/full/invalid codes produce distinct HTTP errors and never create rooms. Codes use `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, are six uppercase characters, retry collisions, and are deregistered when the room disposes.

Display names are trimmed, 1–20 characters, reject control characters, and render through Phaser/React text APIs rather than HTML. Duplicate names are allowed because the Colyseus session ID is authoritative. No identity or reconnect token is stored in a database or browser storage.

On an unexpected drop, the server immediately marks the player disconnected and stops movement while preserving state for 15 seconds. A valid token resumes the same session and resets client prediction. Expiry removes the player and causes the UI to return to the lobby with a clear error. A clean leave skips reconnection, clears timers/listeners/prediction/interpolation/entities, and permits empty-room disposal.

## Environment

| Variable                    | Default                 | Purpose                              |
| --------------------------- | ----------------------- | ------------------------------------ |
| `GAME_SERVER_PORT`          | `2567`                  | HTTP and WebSocket port              |
| `GAME_SERVER_HOST`          | `127.0.0.1`             | bind host                            |
| `CLIENT_ORIGIN`             | `http://127.0.0.1:4173` | allowed browser origin               |
| `VITE_GAME_SERVER_URL`      | `ws://127.0.0.1:2567`   | browser WebSocket endpoint           |
| `VITE_GAME_SERVER_HTTP_URL` | `http://127.0.0.1:2567` | browser lobby endpoint               |
| `LOAD_TEST_DURATION_MS`     | `60000`                 | bot traffic duration; minimum `1000` |
| `LOAD_SERVER_PORT`          | `2570`                  | embedded load-test server port       |

## Important files

- `packages/game-core/src/movement.ts`: authoritative/predicted cardinal movement and safe spawns
- `packages/network-protocol/src/{types,config,validation}.ts`: shared wire contract and validation
- `apps/game-server/src/rooms/FloorOneRoom.ts`: room lifecycle, messages, ticks, and reconnect policy
- `apps/game-server/src/simulation/playerSimulation.ts`: deterministic authoritative player state
- `apps/game-server/src/validation/rateLimiter.ts`: isolated token buckets and abuse escalation
- `apps/game-server/src/lobby/RoomCodeRegistry.ts`: code generation/resolution/cleanup
- `apps/game-server/src/app.ts`: Colyseus transport, HTTP lobby, CORS, and health
- `apps/client/src/game/multiplayer/{MultiplayerClient,prediction,interpolation}.ts`: transport lifecycle and netcode
- `apps/client/src/game/scenes/MultiplayerScene.ts`: online Phaser rendering/input/camera
- `apps/client/src/App.tsx` and `apps/client/src/ui/Online*.tsx`: mode, lobby, status, and errors
- `tests/e2e/multiplayer.spec.ts`: multi-context room/movement/reconnect/lifecycle coverage
- `tests/load/ten-player-room.ts`: ten-client sustained traffic and cleanup harness

## Verification and performance evidence

The original Phase 1 baseline passed formatting, lint, strict TypeScript, 18 unit/component tests, coverage thresholds (79.13% statements overall), production build, and four Playwright runs (two scenarios across desktop/mobile).

Final Phase 2 evidence:

| Verification                          | Result                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Clean `npm ci`                        | passed; 575 packages audited                                                         |
| Format, ESLint, strict TypeScript     | passed                                                                               |
| Unit/component/integration suite      | 83/83 passed across 15 files                                                         |
| Coverage                              | 90.03% statements/lines, 83.81% branches, 89.28% functions                           |
| Client and server production build    | passed; built server was started with Node and answered `/health`                    |
| Full desktop/mobile Playwright matrix | 12/12 passed                                                                         |
| Focused multiplayer command           | 57/57 Vitest checks and 4/4 Chromium scenarios passed                                |
| Ten-player sustained load             | 60,444 ms; 9,520 commands; no rejection, disconnect, or server error; cleanup passed |
| Production dependency audit           | 0 vulnerabilities with `npm audit --omit=dev`                                        |

The dependency install reports 17 audit findings in development-only transitive tooling (15 high, 2 critical); no forced/breaking audit rewrite was applied. Production dependencies report zero findings.

The load harness reports commands, rejected valid traffic, unexpected disconnects, server errors, average ping, heap delta, and empty-room cleanup. Client network sends run on controlled timers, pending and interpolation collections are bounded, React state changes only for meaningful status/HUD data, and Phaser owns per-frame transforms. Vite currently warns that the Phaser client bundle exceeds 500 kB; code splitting is the main known production performance opportunity.

The final measured headless online render cadence was 41.8 FPS in Desktop Chromium and 59.8 FPS in the emulated 915×412 mobile-landscape profile. The 60-second load averaged 2 ms local ping and grew the Node heap by approximately 7.05 MB while hosting ten clients; all bots left and the empty room/code cleaned up. No recurring browser page/console errors were observed outside the expected SDK warning injected by the offline reconnection scenario.

## Multiplayer verification checklist

- **Startup — passed:** production server start, `/health`, client start, Local Prototype, Online Sandbox, and single-canvas lifecycle.
- **Room lifecycle — passed:** creation, six-character code, exact join, invalid/unknown/full/expired rejection, clean leave/recreate, and empty-room/code cleanup.
- **Presence — passed:** two-player visibility/count/name rendering, three visual members per remote team, non-blocking overlap design, ten-player capacity, and room isolation.
- **Movement — passed:** immediate prediction, authoritative replication, shared collision/bounds, cardinal keyboard input, mobile joystick movement, visibility/disconnect stop paths, and controlled command cadence.
- **Reconciliation — passed:** no/smooth/hard correction classification, collision correction, bounded pending replay, reconnect reset, and stable local camera follow.
- **Connection — passed:** latency display, clean leave, disconnected preservation, reconnect overlay, successful same-session reconnect, no duplicate player, and expired-token removal/rejection with lobby fallback.
- **Lifecycle — passed:** Local and Online mode mounting, repeated online leave/create, reload without duplicate canvas/connection loop, listener/timer cleanup, and no recurring browser/server errors under normal traffic.
- **Capacity/performance — passed:** ten clients, eleventh rejection, 20 Hz controlled traffic for 60 seconds, responsive server health, clean bot disconnect, desktop ≥30 FPS, and emulated mobile ≈60 FPS.

## Known limitations

- Room codes and identity exist only in server/client memory. A full page reload intentionally returns to mode selection rather than persisting a reconnect credential; it leaves no duplicate canvas or reconnect loop.
- The reconnect overlay shows status but not a numeric countdown.
- Mobile performance has automated viewport coverage but should still be profiled on representative physical devices.
- The client bundle contains Phaser in a large chunk and triggers Vite's size warning.
- The server is single-process/in-memory; multi-process room discovery would require an approved shared presence/driver design in a later deployment phase.

## Safe Phase 3 starting point

Keep movement, room lifecycle, and session state unchanged. First define transport-neutral monster snapshots and combat intents in `network-protocol`; then move deterministic monster ticking, target selection, damage, death, respawn, and reward ownership from `GameScene` into the existing fixed server loop. Extend the room schema and interpolate remote monsters on the client before removing the Local-only equivalents. Add deterministic server and multi-client tests at each step. Do not introduce persistence or accounts until shared combat authority is stable.
