# Odd Tower Phase 2 Online Multiplayer Foundation Implementation Plan

> **For agentic workers:** Execute this plan inline with red/green/refactor TDD. Do not invoke Git or create commits, branches, worktrees, or tags.

**Goal:** Add a complete, server-authoritative online movement sandbox for one to ten players while preserving the independently playable Phase 1 local prototype.

**Architecture:** Keep deterministic geometry and movement in pure `game-core`, transport-neutral command types and validators in `network-protocol`, authoritative room/session state in a Node.js Colyseus server, prediction/interpolation in focused client modules, Phaser as the online renderer, and React as the mode/lobby/status shell. The client sends only cardinal intent; the server owns position, collision, sequence acknowledgements, rate limiting, reconnection, and room lifecycle.

**Tech Stack:** npm workspaces, strict TypeScript 5.9, React 19, Phaser 3.90, Vite 8, Colyseus 0.17, `@colyseus/sdk` 0.17, `@colyseus/schema` 4, Express, Vitest 3, Testing Library, Playwright 1.55.

## Global Constraints

- Never execute a Git command or inspect/modify `.git`.
- Preserve the Phase 1 local prototype and its existing tests.
- Online mode contains movement and room presence only: no monsters, combat, rewards, progression, persistence, accounts, database, or later-phase placeholders.
- Server simulation and state patches run at 20 Hz; client input samples run at 20 Hz and direction changes send immediately.
- Movement is cardinal-only at the Phase 1 fighter anchor speed of 120 pixels/second.
- Stale input stops after 500 ms; reconnection grace is 15 seconds.
- Interpolation delay is 100 ms; each remote buffer holds at most 20 snapshots; extrapolation is bounded.
- A client may send 30 commands/second with a ten-command burst; repeated sustained abuse is disconnected with a clear reason.
- Room codes use six characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` and are in-memory only.
- All client-controlled strings and numbers are explicitly validated; numeric fields must be finite and sequences must be non-negative safe integers.
- React does not receive per-frame Phaser updates; Phaser/network resources must have explicit cleanup.

## Existing Architecture Assessment

- `packages/game-core` is already DOM-free and owns the 64×64 map, world bounds, formation offsets, and fighter speed. Phase 2 will add one pure fixed-step collision function rather than duplicate geometry in the server/client.
- `apps/client/src/game/scenes/GameScene.ts` is the complete Phase 1 scene. It remains local-only and is mounted only after the user chooses Local Prototype.
- `apps/client/src/game/createGame.ts` currently constructs one local game. It will remain the local factory; a separate online factory and scene will prevent online concerns from entering Phase 1.
- `apps/client/src/App.tsx` currently mounts Phaser immediately. It will become a small mode state machine so no canvas or socket exists on the selection/lobby screen.
- `GameBridge` publishes low-frequency local HUD snapshots. A separate `MultiplayerBridge` will publish connection/room state and accept scene input without changing Phase 1 data.
- The existing npm lockfile establishes npm as package manager. The untouched baseline passed format, lint, typecheck, 18 Vitest tests, build, and four Playwright runs after stale workspace Vite processes were stopped.

## Exact File Map

### Root/tooling

- Modify `package.json`: workspace orchestration, client/server builds, multiplayer, load, and combined development scripts.
- Modify `package-lock.json`: exact Colyseus, Express, SDK, schema, CORS, and orchestration dependencies.
- Modify `tsconfig.json`: add protocol and server project references.
- Modify `vitest.config.ts`: Node environment for server/protocol/network tests and expanded coverage.
- Modify `playwright.config.ts`: start both server and client and retain Phase 1/mobile projects.
- Modify `eslint.config.js`: ignore generated server/client outputs only.
- Create `.env.example`: typed local defaults for ports and origins.

### Shared core and protocol

- Create `packages/game-core/src/movement.ts`: cardinal vector conversion, fixed-step collision/world-bound resolution, safe spawn selection.
- Modify `packages/game-core/src/index.ts`: export movement primitives.
- Create `packages/game-core/tests/movement.test.ts`: authoritative/prediction-compatible movement cases.
- Create `packages/network-protocol/package.json` and `tsconfig.json`: pure workspace package.
- Create `packages/network-protocol/src/types.ts`: commands, snapshots, room metadata, connection/error types.
- Create `packages/network-protocol/src/config.ts`: tick, input, interpolation, correction, reconnect, rate, and queue constants.
- Create `packages/network-protocol/src/validation.ts`: command, join-option, display-name, and room-code validation/normalization.
- Create `packages/network-protocol/src/index.ts`: public exports and protocol version.
- Create `packages/network-protocol/tests/validation.test.ts`: all malformed, finite-number, string, and normalization requirements.

### Server

- Create `apps/game-server/package.json` and `tsconfig.json`: Node ESM server workspace.
- Create `apps/game-server/src/schema/RoomState.ts`: Colyseus `Schema` classes for room metadata and network players.
- Create `apps/game-server/src/simulation/playerSimulation.ts`: per-player accepted input and deterministic fixed-step movement.
- Create `apps/game-server/src/validation/rateLimiter.ts`: isolated token-bucket state and escalating abuse handling.
- Create `apps/game-server/src/lobby/RoomCodeRegistry.ts`: unique code generation, resolution, fullness checks, and disposal cleanup.
- Create `apps/game-server/src/rooms/FloorOneRoom.ts`: join/drop/reconnect/leave lifecycle, message dispatch, tick loop, patch rate, and metadata.
- Create `apps/game-server/src/app.ts`: Colyseus server factory plus `/health`, room creation, and room-code resolution HTTP endpoints with configured CORS.
- Create `apps/game-server/src/config.ts`: validated environment configuration and safe development defaults.
- Create `apps/game-server/src/index.ts`: process entry point and graceful shutdown.
- Create `apps/game-server/tests/playerSimulation.test.ts`, `rateLimiter.test.ts`, `roomCodeRegistry.test.ts`, `room.test.ts`, and `health.test.ts`.

### Client networking and Phaser

- Create `apps/client/src/game/multiplayer/prediction.ts`: bounded pending inputs, immediate local prediction, acknowledgement, replay, and reset.
- Create `apps/client/src/game/multiplayer/interpolation.ts`: bounded timestamp buffers, interpolation, short extrapolation, teleport snap, trim/removal.
- Create `apps/client/src/game/multiplayer/MultiplayerBridge.ts`: low-frequency UI state, room commands, connection state, and cleanup-aware subscriptions.
- Create `apps/client/src/game/multiplayer/MultiplayerClient.ts`: HTTP create/resolve, Colyseus join/reconnect, listeners, controlled 20 Hz sends, heartbeat/RTT, and teardown.
- Create `apps/client/src/game/scenes/MultiplayerScene.ts`: local predicted anchor, remote buffered teams, labels, input capture, camera, map obstacles, and scene cleanup.
- Create `apps/client/src/game/createMultiplayerGame.ts`: exactly one online Phaser instance with injected bridge/client.
- Create `apps/client/tests/prediction.test.ts`, `interpolation.test.ts`, and `MultiplayerBridge.test.ts`.

### React UI and E2E/load

- Modify `apps/client/src/App.tsx`: `selection → local | online-lobby → online-room` lifecycle and complete cleanup on transitions.
- Create `apps/client/src/ui/ModeSelection.tsx`, `OnlineLobby.tsx`, and `OnlineHud.tsx`.
- Modify `apps/client/src/ui/Joystick.tsx`: reusable visibility/class support while preserving cancellation behavior.
- Modify `apps/client/src/styles.css`: responsive lobby, online HUD, reconnect overlay, and mobile-safe controls.
- Create `apps/client/tests/App.test.tsx` and `OnlineLobby.test.tsx`: mode, form, errors, state, leave, listener/timer cleanup.
- Modify `tests/e2e/phase1.spec.ts`: enter Local Prototype before legacy assertions.
- Create `tests/e2e/multiplayer.spec.ts`: create/join, replication, isolation, invalid room, reconnect lifecycle, reload, and mobile layout.
- Create `tests/load/ten-player-room.ts`: 60-second ten-bot run with counters, latency, memory observations, clean leave, and registry cleanup.
- Create `tests/multiplayer/run.ts` only if a dedicated orchestration entry is needed beyond Vitest/Playwright filters.

### Documentation

- Modify `README.md`: both modes, architecture, environment, commands, room flow, controls, load test, exclusions, troubleshooting.
- Create `docs/phase-2-handoff.md`: exact implementation, networking constants, evidence, observations, limitations, and Phase 3 boundary.

## Protocol and Data Flow

`ClientMoveCommand` and `ClientHeartbeatCommand` carry `{type, sequence, clientSentAtMs}` and movement adds `direction`. The protocol validator returns a discriminated result and never throws on untrusted input. Join options contain only a validated display name and protocol version. Server state contains the room summary plus a map of player anchors; it acknowledges the last sequence actually consumed by the simulation.

The lobby creates a room through `POST /rooms` or resolves an exact normalized code through `GET /rooms/:code`; neither endpoint joins or creates implicitly. The client then uses `joinById` with the returned room ID. Registry entries are reserved before response, updated from room lifecycle metadata, and removed during disposal.

At 20 Hz the client samples cardinal intent, immediately advances the pure prediction model by 50 ms, stores a bounded pending input, and sends intent. The server validates/rate-limits it, accepts only a reasonable forward sequence, and consumes the latest accepted input on its 50 ms fixed tick through the same movement function. Schema patches contain authoritative position and acknowledgement.

On a local patch, prediction removes acknowledged commands, resets to the server anchor, and replays remaining commands. Differences under four pixels need no visible correction; differences from four through 64 pixels are eased by the scene; larger differences snap. The camera follows the rendered local anchor only.

Remote patches are timestamped on receipt, capped at 20 entries, and rendered 100 ms behind. The sampler interpolates between surrounding snapshots, may extrapolate at last known cardinal velocity for a short bounded window, stops afterward, and snaps across teleport-sized gaps. Follower positions are always locally derived with `formationDestination`.

## Reconnection and Cleanup

The server uses Colyseus 0.17 `onDrop` to stop movement, mark `connected=false`, and call `allowReconnection(client, 15)`. `onReconnect` reactivates the same schema player/session. Permanent `onLeave` removes player, limiter, and session input. `onDispose` cancels simulation-owned resources and unregisters the code.

The client observes `onDrop`/`onReconnect`, stores only the in-memory `reconnectionToken`, stops input immediately, clears pending prediction, and relies on bounded SDK reconnection. Success rebinds current token/state without creating another player; expiry tears down and returns to the lobby with `RECONNECT_EXPIRED`. Clean leave calls consented leave, clears all intervals/listeners/buffers/entities, and resets bridge state.

## TDD Execution Tasks

### Task 1: Shared movement primitive

- [ ] Add failing tests for cardinal displacement, 120 px/s at 50 ms, `none`, obstacle collision, world bounds, and safe deterministic spawns.
- [ ] Run only `packages/game-core/tests/movement.test.ts` and confirm expected missing-export failures.
- [ ] Implement minimal pure movement functions and exports.
- [ ] Run focused and complete `game-core` tests; refactor only while green.

### Task 2: Protocol package and validation

- [ ] Add package scaffolding and failing tests for every protocol validation acceptance case, including `NaN`, `Infinity`, control characters, and room alphabet.
- [ ] Run focused tests and confirm missing-module/API failures.
- [ ] Implement types, constants, normalization, and non-throwing validators.
- [ ] Run protocol tests, strict typecheck, and formatting.

### Task 3: Server simulation and abuse protection

- [ ] Add failing simulation tests for cardinal-only movement, fixed tick, collision/bounds, stale stop, duplicate/old/jump sequences, acknowledgements, and spawn safety.
- [ ] Add failing rate-limit tests for 20 Hz, burst ten, dropped excess, escalation, and per-client isolation.
- [ ] Implement `PlayerSimulation` and token bucket with injectable clocks.
- [ ] Run focused server unit tests and refactor while green.

### Task 4: Registry, schema, room, and health

- [ ] Add failing registry tests for six-character uniqueness, normalization, unknown/full/expired lookup, deregistration, and repeated cleanup.
- [ ] Add failing Colyseus room tests for create, two joins, ten capacity, rejected eleventh, state, clean leave, drop, reconnect, expiry, disposal, and code cleanup.
- [ ] Add failing HTTP tests for health, CORS, create, resolve, invalid/unknown/full errors.
- [ ] Implement schema state, registry, room lifecycle, tick/patch loop, app factory, validated environment, and graceful entry point.
- [ ] Run all server tests and verify no open-handle/timer leaks.

### Task 5: Prediction and reconciliation

- [ ] Add failing tests for immediate prediction, compatible collision/bounds, bounded pending storage, disconnect stop, no/smooth/hard correction, one/many replay, full acknowledgement, server-collision correction, and reconnect reset.
- [ ] Implement the minimal `PredictionController` with immutable observable results.
- [ ] Run focused prediction tests and refactor while green.

### Task 6: Remote interpolation

- [ ] Add failing tests for midpoint, direction policy, missing future, bounded extrapolation/timeout, teleport snap, 20-entry trim, and player removal.
- [ ] Implement independent per-player buffers and sampler.
- [ ] Run focused interpolation tests and refactor while green.

### Task 7: Client connection adapter

- [ ] Add failing bridge/client tests for create, exact-code join, connection states, player counts, RTT smoothing, input throttling/direction immediacy, reconnect, leave, and timer/listener cleanup.
- [ ] Implement the HTTP/Colyseus adapter with injected time/timers where needed.
- [ ] Run focused client-network tests and strict typecheck.

### Task 8: Online Phaser scene

- [ ] Add testable rendering helpers where browser-independent assertions are possible; keep scene integration observable through data attributes/bridge diagnostics.
- [ ] Implement online map, three-member local/remote formations, safe names, local camera, keyboard/joystick cardinal input, prediction reconciliation, interpolation, and full shutdown.
- [ ] Verify scene switching does not create duplicate canvases or retain local/online timers.

### Task 9: React mode/lobby/HUD

- [ ] Add failing component tests for selection, accessible lobby, create/join requests, invalid code, connection/player/latency updates, reconnect overlay, clean leave, focus, and cleanup.
- [ ] Implement selection, lobby, in-room HUD, error announcements, disabled busy actions, and lifecycle ownership.
- [ ] Run component tests, accessibility queries, lint, and typecheck.

### Task 10: Multiplayer browser and load coverage

- [ ] Add Playwright scenarios using multiple contexts and observable state rather than arbitrary sleeps.
- [ ] Add the 60-second ten-bot script and ensure its result fails on connection, valid-command rejection, unexpected disconnect, server error, or cleanup failure.
- [ ] Add root scripts for combined dev, separate builds, multiplayer suite, and load test.
- [ ] Run focused multiplayer E2E and a development-length load smoke before the final 60-second run.

### Task 11: Documentation and release verification

- [ ] Update README and handoff with exact implemented behavior, environment, constants, commands, exclusions, limitations, and safe Phase 3 seam.
- [ ] Run a placeholder/Phase 3-scope scan over plan, source, tests, and docs.
- [ ] From a clean process state run `npm ci`, format, lint, typecheck, unit, coverage, client/server builds, all E2E, multiplayer, and 60-second load tests.
- [ ] Start server/client, verify `/health`, run the manual checklist in desktop and mobile landscape, inspect browser/server logs, record FPS/latency/memory, and stop all processes.

## Automated Test Strategy

- Pure Vitest suites use real validators, movement, prediction, interpolation, registry, and rate-limit logic with injected clocks; no behavior-only mocks.
- Colyseus integration tests boot the actual local server and SDK clients on ephemeral ports, assert state changes and lifecycle events, then close every client/server.
- React tests use the real bridge and a narrow injected networking port so they assert user-visible state and cleanup rather than Colyseus internals.
- Playwright uses multiple isolated contexts, reads the displayed code, waits on player counts/diagnostics, and records page errors. Phase 1 scenarios explicitly select local mode.
- Load testing connects ten real SDK clients, sends deterministic pseudo-random cardinal inputs at 20 Hz for at least 60 seconds, and validates cleanup after all consented leaves.

## Manual Verification Checklist

- Startup: client, server, health, local mode, online mode, and exactly one canvas.
- Rooms: create, valid/invalid/expired/full joins, leave, empty disposal, and six-character code.
- Presence: two players, counts, safe names, three visuals each, overlap, isolation.
- Movement: immediate local, authoritative correction, smooth remote, shared collision/bounds, cardinal keyboard and joystick, no duplicate commands.
- Reconciliation: no ordinary jitter, smooth small correction, hard invalid correction, stable camera, bounded pending queue.
- Connection: latency, clean leave, unexpected drop, overlay, same-session reconnect, no duplicate player, expiry to lobby.
- Lifecycle: both mode-switch directions, repeat joins, reload, visibility stop, no recurring browser/server errors.
- Capacity: ten join, eleventh rejected, 60-second movement, responsive health, all bots cleanly disconnect.

## Load and Performance Evidence

The final load output records duration, connected players, commands sent, rejected valid commands, unexpected disconnects, latency, server errors, before/after memory, and room/code cleanup. Browser verification records observed FPS at desktop and mobile-landscape viewports. Server tick diagnostics record expected versus executed ticks without logging each tick. Resource tests assert queue/buffer caps and zero owned intervals/listeners after repeated lifecycle cycles.

## Exclusions and Phase 3 Boundary

Phase 2 intentionally contains no persistence, authentication, profiles, databases, shared monsters, monster AI, combat, EXP, loot, summoning, collection, currency, inventory, AFK systems, bosses, portals, progression floors, PvP, rebirth, guilds, chat, or final artwork. The Phase 3 starting point is to add authoritative monster entities and deterministic combat beside the existing server movement simulation, extending the same protocol/schema boundary without moving React or Phaser presentation into server authority.

## Self-Review

- Requirement coverage: protocol, server authority, rooms/codes, reconnection, validation/rate limit, prediction/reconciliation, interpolation/rendering, UI/accessibility, lifecycle, tests, load, performance, docs, and Phase 1 preservation are each owned by an explicit task.
- Ownership: `game-core` owns geometry; protocol owns wire types/validation; server owns authority/lifecycle; client networking owns transport; prediction/interpolation own netcode algorithms; Phaser owns visuals/input; React owns screens/status.
- Type consistency: all movement uses `CardinalDirection` including `none`; sequence acknowledgements use the same non-negative safe-integer type; room metadata uses `floor_1` and max ten throughout.
- Placeholder scan: no deferred implementation markers are present.
- Scope check: no excluded Phase 3–5 feature is scaffolded or implied as working.
