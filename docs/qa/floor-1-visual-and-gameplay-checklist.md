# Floor 1 Visual and Gameplay QA Checklist

## Automated checks completed

- [x] Map is exactly 64×64 at 32 px per tile.
- [x] All 12 required layer names validate.
- [x] Spawn, camp exits, boss arena, and portal are reachable on the shared grid.
- [x] Collision blocks player and monster movement.
- [x] Slow terrain affects movement and weighted navigation.
- [x] Right-facing images remain unflipped when moving right and mirror when moving left.
- [x] Vertical motion preserves facing; idle jitter settles.
- [x] Visual squash/stretch does not alter root or collision transforms.
- [x] Guardian phases, attacks, adds, enrage, contribution, defeat, and reset have unit coverage.
- [x] Portal completion is manual and reward application is idempotent in room memory.
- [x] Typecheck, lint, and production build pass.

## Manual browser pass required with local Supabase running

- [ ] Sign in as guest and launch Local Prototype.
- [ ] Confirm exactly one canvas and visible HUD after launch and reload.
- [ ] Walk every camp exit and biome route; verify no visual/collision mismatch.
- [ ] Compare normal and slow-terrain travel time.
- [ ] Inspect local hero and all followers moving left/right/up/down and stopping.
- [ ] Join a second client; inspect remote interpolation, facing stability, and follower motion.
- [ ] Fight each monster family and confirm fallback/world-image alignment.
- [ ] Reach progress cap, enter guardian arena, inspect frontal/cold/add/enrage telegraphs.
- [ ] Defeat guardian with eligible and ineligible contributors.
- [ ] Confirm portal unlocks but does not auto-complete.
- [ ] Press `E` near portal twice; verify rewards appear once.
- [ ] Capture camp, slow terrain, guardian, unlocked portal, and completion-summary screenshots.

## Browser blocker observed

The direct Playwright pass reached the app but guest authentication failed without the local database runtime. The canonical E2E launcher reported `Local Supabase is not running`; no screenshot-based visual approval is claimed.
