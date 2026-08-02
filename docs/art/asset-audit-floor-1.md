# Floor 1 Asset Audit

Audit date: 2026-08-02. No images were generated or moved.

| Asset ID | Type | Existing file | Status | Usage | New asset required | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| hero.*.world (6) | Character | `assets/heroes/*/left_*.png` | Conversion Required | All hero world views | No new design; export required | Approved source identity exists, but canonical right-facing transparent WebP paths are missing |
| monster.*.world (5) | Character | Prompt owners only | Missing | Floor 1 combat | Yes | No production world images found |
| boss.angry_refrigerator.world | Character | Prompt owner only | Missing | Guardian encounter | Yes | No production boss image found |
| add.frozen_food.*.world (2) | Character | Prompt owner only | Missing | Boss adds | Yes | No production add image found |
| npc.*.world (3) | Character | None before this pass | Missing | Camp ambience/interactions | Yes | Moving NPC world images are required by the shared runtime |
| map.floor_1.tiles | Tileset | Manifest/prompt only | Placeholder | Floor 1 world | Yes | Procedural graybox currently supplies biome readability |
| map.floor_1.background | Environment | Manifest/prompt only | Placeholder | Floor 1 world | Yes | Procedural map renderer currently supplies ground fields |
| central camp landmarks | Props | Environment prompts | Placeholder | Shrine, station, AFK chest | Yes | Runtime uses readable labels/shapes |
| spicy forest props | Props | Environment prompts | Missing | Chili and sauce landmarks | Yes | No production WebPs found |
| chocolate swamp props | Props | Environment prompts | Missing | Cookie stones/wafer bridges | Yes | No production WebPs found |
| boss arena props | Props | Environment prompts | Missing | Arena boundary/telegraphs | Yes | No production WebPs found |
| portal sealed/ready | Prop/VFX | Environment prompts | Placeholder | Floor completion | Yes | Runtime uses procedural portal states |
| vfx.* (5 families) | VFX | Manifest/prompt only | Placeholder | Combat feedback | Yes | Runtime uses pooled Phaser primitives |

## Existing Usable Sources

The six PNG hero sources are retained unchanged as identity references and can be normalized/exported into the canonical world paths after approval. Existing portrait, icon, collection-card, UI, VFX, boss, and environment prompt content unrelated to the four-pose contract is preserved.

## Prompt Coverage

- Six hero owner files now include one active world-image prompt each.
- Five monster owner files now include one active world-image prompt each.
- Angry Refrigerator and frozen-food add owner files include active single-image prompts.
- `art-prompts/npcs/floor_1_moving_npcs.md` covers all three camp NPCs.
- Existing Floor 1 environment owner files cover tiles, camp, fields, forest, swamp, arena, portal, structures, and transitions.

## Placeholder Policy

Missing production art resolves to generated Phaser shapes or procedural map layers. Missing images must not crash gameplay, change entity identity, or imply that final art was approved.
