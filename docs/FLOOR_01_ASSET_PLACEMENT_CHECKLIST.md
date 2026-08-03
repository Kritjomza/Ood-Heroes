# Floor 01 Asset Placement Checklist

Asset root: `apps/client/public/assets/game/floor-01/`

## Export checklist

- [ ] Export every file as WebP in sRGB, without embedded text or copyrighted characters.
- [ ] Use straight-alpha transparent backgrounds where required; remove matte-colored edge pixels.
- [ ] Keep ground textures seamless on all four edges and test them in a 3 x 3 repeat.
- [ ] Keep contact points near the documented origin; do not bake long cast shadows into rotatable props.
- [ ] Preserve at least 8 px transparent padding around props and 16 px around landmarks.
- [ ] Keep important silhouettes inside the central 80% so rotations do not clip.
- [ ] Replace files at the exact paths; do not change asset IDs or scene code.

## Placement and gameplay checklist

- [ ] Honey ground reads as Zone 1; mint marsh reads as Zone 2; cocoa woodland reads as Zone 3.
- [ ] Transition pieces hide hard zone edges without changing zone coordinates.
- [ ] River straight pieces join without seams; bend/foam/bridge align to the same 64 px displayed module.
- [ ] Rocks, reeds, roots, shrubs, and crystals visually explain existing collision, but collision remains data-driven.
- [ ] Mint puddles visually explain slow terrain; stepping stones remain visually walkable.
- [ ] Tall props use bottom/foot origins and sort above actors only where documented.
- [ ] Landmarks align to existing summon, team, AFK, arena, and portal coordinates.
- [ ] Minimap markers still match the unchanged 64 x 64 world coordinates.
- [ ] Verify 390 x 844 portrait, 844 x 390 landscape, and 1440 x 900 desktop.
- [ ] Verify reduced motion, keyboard focus, touch movement, collision, combat, portal, and reconnect behavior.

