# Floor 01 Asset Requirements

All final artwork belongs under `apps/client/public/assets/game/floor-01/`. The current status for every entry is **generated fallback**. Replace a file at the exact path and restart the client; no scene code or registry ID changes are required.

General style: bright handmade toy-box RPG, thick cocoa outlines, painted paper/felt surfaces, soft inset highlights, compact shadows, no text baked into ground art. Source dimensions below are final export dimensions. Display sizes are Phaser world pixels.

| Filename | Exact destination path | Category | Zone | Source px | Display px | Alpha | Seamless | Origin | Rotate / mirror | Collision | Layer | Target | Status |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---:|---|
| zone-1-honey-meadow.webp | apps/client/public/assets/game/floor-01/ground/zone-1-honey-meadow.webp | Ground | Zone 1 | 128x128 | 64x64 | No | Yes, 4 edges | .5,.5 | No / No | None | Ground | 45 KB | Generated fallback |
| zone-2-mint-marsh.webp | apps/client/public/assets/game/floor-01/ground/zone-2-mint-marsh.webp | Ground | Zone 2 | 128x128 | 64x64 | No | Yes, 4 edges | .5,.5 | No / No | Slow data separate | Ground | 45 KB | Generated fallback |
| zone-3-cocoa-woodland.webp | apps/client/public/assets/game/floor-01/ground/zone-3-cocoa-woodland.webp | Ground | Zone 3 | 128x128 | 64x64 | No | Yes, 4 edges | .5,.5 | No / No | None | Ground | 45 KB | Generated fallback |
| central-camp-cloth.webp | apps/client/public/assets/game/floor-01/ground/central-camp-cloth.webp | Ground | Camp | 128x128 | 64x64 | No | Yes | .5,.5 | No / No | Safe-zone data separate | Ground | 45 KB | Generated fallback |
| guardian-arena-plate.webp | apps/client/public/assets/game/floor-01/ground/guardian-arena-plate.webp | Ground | Arena/portal | 128x128 | 64x64 | No | Yes | .5,.5 | No / No | Arena data separate | Ground | 50 KB | Generated fallback |
| honey-to-mint.webp | apps/client/public/assets/game/floor-01/transitions/honey-to-mint.webp | Transition | 1-2 | 128x128 | 64x64 | Yes | Edge module | .5,.5 | Yes / Yes | None | Ground | 35 KB | Generated fallback |
| mint-to-cocoa.webp | apps/client/public/assets/game/floor-01/transitions/mint-to-cocoa.webp | Transition | 2-3 | 128x128 | 64x64 | Yes | Edge module | .5,.5 | Yes / Yes | None | Ground | 35 KB | Generated fallback |
| cocoa-to-honey.webp | apps/client/public/assets/game/floor-01/transitions/cocoa-to-honey.webp | Transition | 3-1 | 128x128 | 64x64 | Yes | Edge module | .5,.5 | Yes / Yes | None | Ground | 35 KB | Generated fallback |
| blueberry-straight.webp | apps/client/public/assets/game/floor-01/river/blueberry-straight.webp | River | River | 128x128 | 64x64 | Yes | Ends must join | .5,.5 | Yes / No | None | Ground | 45 KB | Generated fallback |
| blueberry-bend.webp | apps/client/public/assets/game/floor-01/river/blueberry-bend.webp | River | River | 128x128 | 64x64 | Yes | Joins straight | .5,.5 | Yes / Yes | None | Ground | 45 KB | Generated fallback |
| blueberry-bank.webp | apps/client/public/assets/game/floor-01/river/blueberry-bank.webp | River bank | River | 128x128 | 64x64 | Yes | One axis | .5,.5 | Yes / Yes | Visual cue | Ground | 40 KB | Generated fallback |
| wafer-bridge.webp | apps/client/public/assets/game/floor-01/river/wafer-bridge.webp | Crossing | River | 128x128 | 128x64 | Yes | No | .5,.5 | Yes / No | Existing walkability | Above actors | 55 KB | Generated fallback |
| soda-foam.webp | apps/client/public/assets/game/floor-01/river/soda-foam.webp | Decal | River | 128x128 | 64x64 | Yes | Ends should join | .5,.5 | Yes / Yes | None | Ground | 30 KB | Generated fallback |
| biscuit-rock.webp | apps/client/public/assets/game/floor-01/props/biscuit-rock.webp | Prop | Zone 1 | 128x128 | 54x48 | Yes | No | .5,.5 | Yes / Yes | Visual cue only | Below actors | 35 KB | Generated fallback |
| warm-flower-cluster.webp | apps/client/public/assets/game/floor-01/props/warm-flower-cluster.webp | Prop | Zone 1 | 128x128 | 44x38 | Yes | No | .5,.5 | Yes / Yes | None | Below actors | 25 KB | Generated fallback |
| friendly-sign.webp | apps/client/public/assets/game/floor-01/props/friendly-sign.webp | Prop | Zone 1 | 128x128 | 62x76 | Yes | No | .5,.9 | No / No | Visual cue only | Above actors | 35 KB | Generated fallback |
| mint-puddle.webp | apps/client/public/assets/game/floor-01/props/mint-puddle.webp | Decal | Zone 2 | 128x128 | 96x52 | Yes | No | .5,.5 | Yes / Yes | Slow terrain data | Ground | 35 KB | Generated fallback |
| jelly-reeds.webp | apps/client/public/assets/game/floor-01/props/jelly-reeds.webp | Prop | Zone 2 | 128x128 | 52x68 | Yes | No | .5,.9 | No / Yes | Visual cue only | Above actors | 35 KB | Generated fallback |
| marsh-stepping-stones.webp | apps/client/public/assets/game/floor-01/props/marsh-stepping-stones.webp | Decal | Zone 2 | 128x128 | 96x48 | Yes | No | .5,.5 | Yes / Yes | Walkable | Ground | 35 KB | Generated fallback |
| soda-bubbles.webp | apps/client/public/assets/game/floor-01/props/soda-bubbles.webp | Prop/FX | Zone 2 | 128x128 | 40x56 | Yes | No | .5,.5 | No / Yes | None | Below actors | 25 KB | Generated fallback |
| candy-roots.webp | apps/client/public/assets/game/floor-01/props/candy-roots.webp | Prop | Zone 3 | 128x128 | 90x58 | Yes | No | .5,.5 | Yes / Yes | Visual cue only | Below actors | 40 KB | Generated fallback |
| ember-peppers.webp | apps/client/public/assets/game/floor-01/props/ember-peppers.webp | Prop | Zone 3 | 128x128 | 46x54 | Yes | No | .5,.9 | No / Yes | None | Below actors | 30 KB | Generated fallback |
| dark-cocoa-shrub.webp | apps/client/public/assets/game/floor-01/props/dark-cocoa-shrub.webp | Prop | Zone 3 | 128x128 | 68x60 | Yes | No | .5,.85 | No / Yes | Visual cue only | Above actors | 35 KB | Generated fallback |
| purple-crystal.webp | apps/client/public/assets/game/floor-01/props/purple-crystal.webp | Prop | Zone 3 | 128x128 | 48x62 | Yes | No | .5,.9 | No / Yes | Visual cue only | Above actors | 35 KB | Generated fallback |
| summon-shrine.webp | apps/client/public/assets/game/floor-01/landmarks/summon-shrine.webp | Landmark | Camp | 256x256 | 118x118 | Yes | No | .5,.9 | No / No | Gameplay point separate | Above actors | 90 KB | Generated fallback |
| team-station.webp | apps/client/public/assets/game/floor-01/landmarks/team-station.webp | Landmark | Camp | 256x256 | 118x118 | Yes | No | .5,.9 | No / No | Gameplay point separate | Above actors | 90 KB | Generated fallback |
| afk-chest.webp | apps/client/public/assets/game/floor-01/landmarks/afk-chest.webp | Landmark | Camp | 256x256 | 96x96 | Yes | No | .5,.9 | No / No | Gameplay point separate | Above actors | 75 KB | Generated fallback |
| floor-2-portal.webp | apps/client/public/assets/game/floor-01/landmarks/floor-2-portal.webp | Landmark | Portal | 384x384 | 224x176 | Yes | No | .5,.88 | No / No | Portal data separate | Above actors | 150 KB | Generated fallback |
| guardian-arena-gate.webp | apps/client/public/assets/game/floor-01/landmarks/guardian-arena-gate.webp | Landmark | Arena | 384x256 | 224x144 | Yes | No | .5,.9 | No / No | Boundary data separate | Above actors | 130 KB | Generated fallback |

## Image Creation Details

- Ground tiles need broad low-frequency color variation and only sparse motifs; avoid visible square centers or strong directional lighting.
- Transitions are transparent feathered borders, not complete ground replacements. Keep both participating materials visible.
- River endpoints meet at the exact midpoint of each edge. Foam remains separate so it can be varied without duplicating water tiles.
- Props use compact local shadows only. Tall prop origins sit at their ground-contact point so depth sorting reads correctly.
- Collision-related props communicate an existing blocked area but never define physics. Do not enlarge silhouettes beyond displayed dimensions.
- Landmark art must leave its upper silhouette readable under labels and must not include localized words.

## Replacement Instructions

1. Create the listed subfolders under the asset root.
2. Export each final image using the exact filename and dimensions above.
3. Replace or add the file at its destination path.
4. Restart the Vite client so Phaser reloads the texture cache.
5. Do not alter the registry ID, world coordinates, collision data, or minimap model.

