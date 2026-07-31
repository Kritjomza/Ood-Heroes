# Odd Tower Phase 4 Asset Creation Report

The Phase 4 UI runs entirely on programmatic CSS shapes and project-authored glyph
fallbacks. Final artwork is deliberately absent. Every visual location has a stable
Asset ID and a documented replacement target so final art can be introduced without
changing screen or gameplay components.

## Inventory

| Priority  | Entries |
| --------- | ------: |
| P0        |      39 |
| P1        |      65 |
| P2        |      19 |
| **Total** | **123** |

- Hero portraits: 6
- Hero icons: 6
- Hero collection cards: 6
- Hero silhouettes: 6
- Hero sprite deliverables: 54
- Direction-specific Hero idle/walk deliverables: 48
- Hero animation frames: 432
- General UI icons: 9
- VFX deliverables: 5
- Environment deliverables: 2
- Monster deliverables: 5

Each Hero has four-direction idle and walk coverage plus a four-direction attack
atlas. The target frame budget is 16 idle, 24 walk, and 32 attack frames per Hero,
or 72 frames per Hero and 432 Hero frames overall.

## Files

- Machine-readable manifest: `docs/assets/phase-4-asset-manifest.json`
- Spreadsheet-friendly manifest: `docs/assets/phase-4-asset-manifest.csv`
- Manifest contract: `docs/assets/phase-4-asset-manifest.schema.json`
- Replacement workflow: `docs/assets/phase-4-replacement-guide.md`
- Desktop and mobile mockups: `docs/assets/mockup-screens/`

## Recommended production order

1. P0 identity and economy art: portraits, collection cards, currencies, Auth,
   Home, Summon, Team, and AFK UI.
2. P1 combat content: Hero sprites, Floor 1 monsters, map, and combat VFX.
3. P2 supporting silhouettes, rarity frames, badges, and general UI symbols.
4. Run `npm run assets:validate`, then inspect desktop and mobile layouts at 48 CSS
   pixels before accepting each delivery.

## Open decisions

Final atlas packing, animation timing, and production export tooling remain art-pipeline
decisions. Stable IDs, frame budgets, directions, dimensions, anchors, and replacement
paths are fixed by the manifest. No licensed characters, generated final art, audio, or
Phase 5 environments are included.
