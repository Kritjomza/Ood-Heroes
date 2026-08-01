# Odd Tower

Google OAuth is the primary permanent sign-in option; Guest and email/password authentication remain supported. Configure it with [the Google OAuth setup guide](docs/auth/google-oauth-setup.md) and complete [the manual checklist](docs/auth/google-oauth-manual-checklist.md). Local development uses `http://127.0.0.1:4173` with app callbacks at `/auth/callback` and `/auth/link-callback`.

## Phase 4 persistent development

Odd Tower now supports Supabase Auth, PostgreSQL-backed progression, six collectible Heroes, Summon pity/duplicates, Stars, saved teams, exactly-once combat rewards, trusted-time AFK rewards, and responsive programmatic mock UI. The original Local Prototype remains available.

Copy `.env.example` to your local environment and supply the browser publishable values plus server-only secret values. Start Docker Desktop, then:

```text
npm ci
npm run supabase:start
npm run db:reset
npm run db:test
npm run dev
```

Quality and security commands:

```text
npm run db:lint
npm run db:types
npm run test:auth
npm run test:persistence
npm run test:database
npm run test:security
npm run test:restart
npm run test:load:persistence
npm run assets:manifest
npm run assets:validate
npm run assets:screenshots
npm run build
npm run secrets:scan
```

The local Supabase API defaults to `http://127.0.0.1:54321`; the game server to `http://127.0.0.1:2567`; and Vite to `http://127.0.0.1:4173`. Do not expose `SUPABASE_SECRET_KEY` to Vite or commit local secrets.

On the Auth screen, choose **Play as Guest**, **Create account**, or **Sign in**.
Guest progress is tied to the browser session until **Account → Protect Progress**
attaches email/password credentials to the same user. Sign-out clears only the local
session; it does not delete progression. See `docs/auth/phase-4-auth-flow.md`,
`docs/database/phase-4-security.md`, and `docs/assets/phase-4-asset-report.md`.

Odd Tower ships two separate playable modes:

- **Local Prototype (Phase 1):** the offline three-hero action-idle RPG slice with local monsters, combat, EXP, leveling, Auto Hunt, retreat/recovery, respawn, keyboard, and touch controls.
- **Online Shared Combat Sandbox (Phase 3):** a server-authoritative Floor 1 room for 1–10 temporary players. Everyone sees and fights the same 34–50 monsters, can focus targets or enable server Auto Hunt, earns session-only EXP and Gold, and can reconnect after a short network interruption.

## Requirements and Installation

- Node.js 22.12 or newer (developed on Node 24)
- npm 11 or newer
- Chromium installed for Playwright browser tests

```bash
npm ci
npx playwright install chromium
```

The checked-in defaults work locally. Optional environment overrides are:

```text
PORT=2567
CLIENT_ORIGIN=http://127.0.0.1:4173
VITE_GAME_SERVER_URL=ws://127.0.0.1:2567
VITE_GAME_SERVER_HTTP_URL=http://127.0.0.1:2567
```

## Run Locally

Start client and server together:

```bash
npm run dev
```

Or in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

After `npm run build`, start the compiled server with `npm start -w @odd-tower/game-server`. The server binds to all network interfaces on `PORT` (default `2567`); locally, open `http://127.0.0.1:4173` and use `http://127.0.0.1:2567/health` for health checks.

Choose **Online Shared Combat Sandbox**, enter a 1–20 character display name, then create a room or join an existing six-character code. Codes are temporary and case-insensitive.

Online combat progress is temporary during Phase 3. `Session Gold`, `Session Level`, and `Session EXP` reset when the room session ends; no account or database is used.

## Controls and Combat

- WASD or arrow keys: cardinal movement.
- Touch joystick: cardinal movement on touch layouts.
- Local mode: Space or the HUD button toggles local Auto Hunt; Escape pauses.
- Online mode: click/tap a monster to focus it; **Auto Hunt** asks the server to navigate, fight, retreat below 25% team HP, recover in the Safe Zone to 80%, and continue.
- Any non-idle manual keyboard or joystick input immediately disables online Auto Hunt.
- **Leave Room** cleanly disconnects and returns to the lobby.

Online commands contain only movement intent, a focus monster ID, or an Auto Hunt boolean. The server decides positions, paths, HP, damage, cooldowns, status effects, death, respawn, EXP, Gold, and levels.

The Safe Zone heals living heroes by 10% max HP per second. A defeated individual hero revives at 50% HP after five uninterrupted seconds in the zone while another hero lives. A full team wipe disables movement for a server-owned five-second countdown, then restores the team at full HP in the Safe Zone with Auto Hunt disabled.

## Architecture

- `packages/game-core`: pure deterministic TypeScript for map/collision, formation, seeded RNG, five monster definitions, damage, targeting, contribution eligibility, status effects, progression, and Auto Hunt thresholds.
- `packages/network-protocol`: protocol v3 movement/focus/Auto Hunt commands, combat snapshots/events, tuning, and strict runtime validation.
- `apps/game-server`: Colyseus/Node authority for the 20 Hz room simulation, monster AI/specials, combat, contributions, idempotent session rewards, Auto Hunt, Safe Zone, wipe/revival, reconnection, rate limiting, cleanup, and health.
- `apps/client/src/game`: separate local and online Phaser scenes. Online predicts only the Team Anchor, renders shared monsters/HP/target markers, consumes authoritative combat state, and deduplicates events.
- `apps/client/src/ui`: React lobby/session HUD with hero HP/EXP/levels, Session Gold, Auto Hunt, focus, countdown, and temporary-progression notice.

See `docs/phase-3-handoff.md` for combat ordering, reward idempotency, evidence, limitations, and the Phase 4 persistence seam.

## Phase 3.5 Hardening

Online combat now uses a bounded fixed-step 20 Hz simulation, 5 Hz expensive monster decisions, 1 Hz seeded idle wandering, a 160 px spatial grid, and collision-aware four-direction A\* fallback. Stuck monsters recover without pathfinding every tick; repeated unreachable failures temporarily blacklist a target. Schema projection writes changed values only, event queues remain bounded, and old contribution/reward state is cleaned by lifecycle.

The online UI uses a playful sticker-card design with cream, peach, pink, mint, sky, lavender, and chocolate tokens. Team HP, Auto Hunt state, room status, temporary rewards, and wipe countdown have separate accessible components. Phaser displays world-space hero/monster HP bars, target markers, charge lanes, hit/defeat/respawn feedback, and bounded heal/slow effects.

Auto Hunt states are `disabled`, `acquiring-target`, `navigating`, `engaging`, `retreating`, `recovering`, and `waiting`. Keyboard or joystick movement returns control to manual mode immediately.

Mobile landscape is tested at 915x412, 844x390, and 740x360. Safe-area insets, 48 px touch targets, a portrait orientation hint, and reduced-motion preferences are supported. Use browser device emulation for layout checks; a physical device is still recommended before public release.

The maximum expected MVP load is ten players and fifty monsters. The final 60-second hardening run sustained 20.0 Hz (1,200/1,200 ticks). Run `npm run test:load:hardening` to reproduce the complete load gate. See `docs/phase-3-5-handoff.md` for percentiles and full evidence.

## Verification Commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npm run test:e2e
npm run test:multiplayer
npm run test:combat
npm run test:hardening
npm run test:sustained
npm run test:load
npm run test:load:combat
npm run test:load:hardening
npm audit --omit=dev
```

`test:load` retains the Phase 2 movement load. `test:sustained` accelerates ten simulated combat minutes. `test:load:combat` connects ten real bot clients for 60 seconds, scales to 50 monsters, mixes focus/Auto Hunt/manual commands, and records kills, respawns, reward IDs, tick drift, latency, memory, errors, and cleanup. Set `COMBAT_LOAD_DURATION_MS` to at least `1000` only for a short diagnostic.

`test:hardening` runs the scheduler, spatial-grid, navigation, projection, UI, and Chromium edge-case gate. `test:load:hardening` runs the mandatory 60-second 10-player/50-monster performance acceptance gate with structured tick percentiles, AI/path/query counters, bounded-state counters, latency, heap, and cleanup.

## Troubleshooting

- **Server unavailable:** confirm `npm run dev:server` is running and `/health` responds.
- **Browser CORS error:** set `CLIENT_ORIGIN` to the exact client origin and restart the server.
- **Room not found:** room codes exist only in memory and disappear with empty rooms/server restarts.
- **Protocol mismatch:** reinstall from the lockfile and restart both client and server; Phase 3 uses protocol v3.
- **Reconnection expired:** return to the lobby; the same session is reserved for 15 seconds.
- **Auto Hunt waiting:** no reachable non-blacklisted monster is available; the server retries at a bounded interval.
- **Monster pauses near a wall:** it waits for the bounded stuck threshold before requesting A\*; repeated failures blacklist the target for five seconds.
- **Mobile HUD overlap:** use landscape orientation and confirm browser zoom is 100%; safe-area and 740x360 minimum layouts are covered.
- **Reduced motion:** enable the operating system/browser reduced-motion preference; nonessential HUD/effect animation is disabled.
- **No saved rewards:** Phase 3 progression is intentionally room-session-only.

## Phase 3 Exclusions

Online mode does not include accounts, authentication, databases, saved progression, hero collection, summoning, shards, inventory, equipment, AFK rewards, bosses, portals, PvP, chat, guilds, trading, rebirth, later floors, monetization, or final artwork.
