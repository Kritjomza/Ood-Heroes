# Floor 1 Preimplementation Audit

## Baseline

- Monorepo: npm workspaces, TypeScript 5.9, Phaser 3.90, React 19, Colyseus, Vitest, Playwright, and Supabase.
- Existing world: a programmatic 64 × 64 grid with 32-pixel tiles and a 2,048 × 2,048 camera/world contract.
- Existing gameplay: local movement/combat prototype; server-authoritative multiplayer movement, interpolation, shared monsters, Auto Hunt, contribution rewards, recovery/respawn, persistence, collection, summon, team, and AFK flows.
- Existing navigation: deterministic four-neighbor A* over the same `prototypeMap` used by cardinal collision.
- Existing art runtime: generated Phaser shapes plus an uncommitted migration toward four-frame hero atlases and one-frame monster textures.

## Conflicts Requiring Migration

| Area | Current active contract | Required contract |
| --- | --- | --- |
| Hero world assets | `sprite_directional`, four frames (`idle_a`, `idle_b`, `move_left_a`, `move_left_b`) | One `world.webp` image per hero |
| Hero runtime | Frame cadence and movement-only mirroring | No frame switching; facing from thresholded visual velocity; idle retains facing |
| Monster art | One static image but legacy left-facing naming in prompts | One canonical `world.webp` per monster, source faces right |
| Floor 1 data | Coded blocked-cell set and fixed spawn array | Typed Tiled-compatible layers and objects as the shared source |
| Safe Zone | Circular center near the middle of the old prototype | Lower-middle camp with three broad exits and map-owned properties |
| Slow terrain | Not represented in shared map/path cost | Map-owned Chocolate Swamp multipliers and weighted navigation |
| Boss and Portal | Not implemented | Server-authoritative boss and manual idempotent completion |

## Existing Assets

Six approved hero source PNGs exist under `assets/heroes/<hero>/left_<hero>.png`. They are usable identity references and provisional single-world sources, but do not yet satisfy the canonical transparent WebP production path or right-facing source convention. No final monster, Angry Refrigerator, frozen-food add, moving NPC, complete tileset, biome prop, or portal-state production WebPs were found in the inspected public/final asset paths.

Existing owner prompts cover six heroes, five monsters, boss/add concepts, and Floor 1 environments. The hero prompt subfolders still contain four-pose prompt files and must be migrated to one world-image prompt per hero. Portrait, icon, collection-card, style, and unrelated UI prompt work is preserved.

## Pre-existing Workspace Changes to Preserve

The pre-restriction audit reported changes in multiplayer protocol/client/server persistence and combat files, asset manifest tooling/reports, scene files, tests, `package.json`, prompt files, and hero source assets. Their persistent-hero identity propagation, online combat changes, reports, and prompt identity/style content are treated as user work. Existing files will receive targeted edits only where the single-sprite, map, boss, or portal requirements require them. Uncertain unrelated changes will remain untouched.

## Risks

- Full production art is absent; procedural rendering and audited placeholders are necessary.
- Moving the Safe Zone affects spawn, recovery, tests, server authority, and camera expectations together.
- Boss/portal persistence must use the existing persistence boundary without weakening idempotency or authentication.
- Multi-client browser/load verification depends on local service availability and may remain environment-limited.
- Physical mid-range mobile performance cannot be proved through desktop emulation.

## Migration Targets

Active four-pose semantics will be migrated only in the hero runtime helper/tests, active asset manifest/generator/validator, hero gameplay prompts/Flow manifest, and current implementation reports. Historical specs and plans remain unchanged as migration history.
