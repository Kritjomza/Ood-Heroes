# Floor 1 Perimeter Adventure Implementation

**Date:** 2026-08-03  
**Status:** Implementation and focused Floor 1 verification complete; full-suite and live browser verification have pre-existing/environmental blockers.

## Implemented

- Mobile-portrait-first Perimeter Adventure HUD with safe-area positioning.
- Four persistent combat actions, tactile state styling, authored SVG controls, keyboard focus, and reduced-motion behavior.
- Structured live local/online world state passed through existing bridge boundaries.
- Pure player-coordinate projection with clamping and accessible portal, guardian, camp, landmark, and target marker states.
- Interactive compact minimap and expanded Floor 1 map with Escape, backdrop, close control, and focus restoration.
- Deterministic Floor 1 zone styles, collision-safe decoration reservations, authored routes, scale limits, richer boundaries, and portal ambience.
- Preserved current persistence, multiplayer authority, combat callbacks, pause, leave, auto-hunt, respawn, and locked inventory behavior.

## Automated Evidence

- Focused Floor 1/HUD suite: 37 tests passed across eight files.
- `npm run typecheck`: passed.
- `npm run build:client`: passed.
- Impeccable detector: the mechanical layout-property animation warning was removed. Remaining findings are advisory token/documentation differences for the extended Floor 1 palette and compact HUD scale.

## Browser Verification Blocker

The Chromium combat and phase-one E2E entry helpers could not enter gameplay. Both fail before Floor 1 because Guest creation reports: “We could not open the tower. Check your connection and try again.” The local Supabase-backed Guest runtime is unavailable in the current environment. The older combat helper also expects the pre-auth mode selector before completing Guest authentication.

No Floor 1 browser assertion failed because those tests never reached Floor 1. Portrait, landscape, and desktop screenshots therefore remain an explicit verification gap until the local Guest/Supabase runtime is available.

The full client suite currently reports 85 passed and three unrelated failures: stale asset replacement-path expectations, a stale persistent-lobby heading expectation, and an existing prediction/collision-coordinate expectation. None of those files were changed by this Floor 1 implementation.

## Known Build Advisories

- Vite reports the existing production `.env` `NODE_ENV` advisory.
- Vite reports the existing large-bundle/chunk advisory, driven primarily by large hero image assets and the current application bundle.

## Data and Persistence

No database schema, persistence payload, network protocol, or authoritative simulation rule was changed. New HUD world position data is presentation-only and remains derived from existing local scene or authoritative multiplayer state.
