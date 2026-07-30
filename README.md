# Odd Tower

Odd Tower currently ships two deliberately separate playable modes:

- **Local Prototype (Phase 1):** the complete offline action-idle RPG slice with three heroes, monsters, combat, EXP, leveling, Auto Hunt, retreat/recovery, respawn, keyboard controls, and touch controls.
- **Online Movement Sandbox (Phase 2):** a server-authoritative Floor 1 movement room for 1–10 temporary players. Each player sees a three-member formation, creates or joins by a six-character code, and can reconnect during a short network interruption. Online mode intentionally has no monsters, combat, rewards, or persistence.

## Requirements

- Node.js 22.12 or newer (developed on Node 24)
- npm 11 or newer
- Chromium installed for Playwright browser tests

## Install and configure

```bash
npm ci
```

The checked-in defaults work locally. Copy `.env.example` to `.env` only when overriding them:

```text
GAME_SERVER_PORT=2567
GAME_SERVER_HOST=127.0.0.1
CLIENT_ORIGIN=http://127.0.0.1:4173
VITE_GAME_SERVER_URL=ws://127.0.0.1:2567
VITE_GAME_SERVER_HTTP_URL=http://127.0.0.1:2567
```

`CLIENT_ORIGIN` is the one browser origin allowed by server CORS. The two Vite variables must point at the same game server using WebSocket and HTTP schemes respectively.

## Run locally

Start the client and server together:

```bash
npm run dev
```

Or use separate terminals:

```bash
npm run dev:server
npm run dev:client
```

After `npm run build`, start the compiled server with:

```bash
npm start -w @odd-tower/game-server
```

Open `http://127.0.0.1:4173`. The server health endpoint is `http://127.0.0.1:2567/health`.

To play online, choose **Online Movement Sandbox**, enter a 1–20 character display name, then either create a room or enter an existing six-character room code. Room codes are temporary, case-insensitive, and disappear when their empty room is disposed or the server restarts.

## Controls

- WASD or arrow keys: cardinal movement
- Touch joystick: cardinal movement on touch layouts
- Local mode only: Space or the HUD button toggles Auto Hunt; Escape pauses
- Online mode: **Leave Room** performs a clean disconnect and returns to the lobby

Opposite horizontal or vertical inputs cancel each other. Online movement commands carry intent only; the server decides final positions, collision, and bounds.

## Architecture

- `packages/game-core`: pure deterministic TypeScript for the map, collision, movement, formation, combat, progression, and Phase 1 behavior. It has no framework or transport dependency.
- `packages/network-protocol`: transport-neutral commands, snapshots, room/error types, network tuning, and strict runtime validation shared by client and server.
- `apps/game-server`: Colyseus/Node server, HTTP lobby resolver, room-code registry, fixed-timestep authoritative simulation, reconnection, rate limiting, and health reporting.
- `apps/client/src/game`: separate Phaser scenes for Phase 1 and Phase 2. Online code owns prediction/reconciliation, interpolation, rendering, camera, input sampling, and socket lifecycle.
- `apps/client/src/ui`: React mode selection, lobby, room status, errors, reconnect overlay, and responsive controls. React receives low-frequency state rather than Phaser frame updates.

See `docs/phase-2-handoff.md` for network algorithms and extension boundaries.

## Verification commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:multiplayer
npm run test:load
```

`npm run test:load` starts an embedded local server, connects ten bots, sends controlled randomized cardinal traffic for at least 60 seconds, reports latency/memory/error counters, leaves cleanly, and checks room cleanup. For a short diagnostic only, set `LOAD_TEST_DURATION_MS` to at least `1000`; the completion test uses the default 60 seconds.

## Troubleshooting

- **Server unavailable:** confirm `npm run dev:server` is running and `/health` responds. Check that the Vite HTTP/WebSocket URLs use the correct host and port.
- **Browser CORS error:** set `CLIENT_ORIGIN` to the exact client origin, including scheme and port, then restart the server.
- **Room not found:** codes are in-memory. The room may have emptied, expired, or belonged to a previous server process. Create a new room; joining never silently creates one.
- **Room full:** one room accepts at most ten active or reconnect-reserved seats.
- **Protocol mismatch:** reinstall from the lockfile with `npm ci` and restart both processes so client and server use the same protocol version.
- **Reconnection expired:** return to the lobby and join again. The same session is reserved for 15 seconds only.
- **Playwright cannot launch:** run `npx playwright install chromium`.

## Phase 2 exclusions

Online mode does not include accounts, databases, saved progression, shared monsters, combat, EXP, loot, inventory, summoning, currency, AFK rewards, bosses, portals, PvP, chat, guilds, rebirth, later floors, or final artwork. Those systems are neither stubbed nor represented as working.
