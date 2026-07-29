# Odd Tower

Odd Tower Phase 1 is a mobile-first local action-idle RPG vertical slice. Control a three-hero team on one 64×64-tile tower floor, fight training radishes automatically, gain levels, or enable Auto Hunt for collision-safe autonomous farming and safety retreats.

## Requirements and commands

- Node.js 22.12+ (developed on Node 24.4)
- npm 11+

```bash
npm ci
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

Open `http://127.0.0.1:4173`. Move with WASD or arrow keys; Space toggles Auto Hunt; Escape pauses. Touch devices display a lower-left four-direction joystick. Any valid manual direction immediately cancels Auto Hunt.

## Architecture

`packages/game-core` is strict, deterministic TypeScript with no Phaser, React, DOM, storage, or network dependency. It owns combat math, progression, formation, navigation, Auto Hunt/monster transitions, balance, and map collision data. `apps/client/src/game` adapts these rules to one Phaser scene with Arcade Physics, rendering, camera, input, and lifecycle. React owns the fixed HUD, joystick, errors, and a typed event bridge that publishes meaningful snapshots at most several times per second.

Phase 1 intentionally excludes multiplayer, accounts, persistence, collection/summoning, currencies, inventory/equipment, AFK rewards, bosses, portals, PvP, rebirth, guild/chat, audio, final art, and floors 2–10.
