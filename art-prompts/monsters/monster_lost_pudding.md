# Lost Pudding Production Prompts

> **Active gameplay contract:** one right-facing `world.webp`; older directional wording below is migration history.

## Active World Image Prompt

- Filename: `monster_lost_pudding_world.webp`
- Production: `/assets/game/monsters/lost_pudding/world.webp`

Create one isolated right-facing 96 × 96 transparent WebP world image of the approved Lost Pudding, preserving its exact pudding silhouette, palette, lost expression, garnish, chocolate outline, and orthographic three-quarter top-down camera. Anchor 0.5,0.82; soft elastic movement-ready stance. One monster only; no sheet, alternate pose, shadow, background, text, blur, or copied design.

## Monster Identity

- **Parent Asset ID:** `monster.lost_pudding`
- **Implementation:** Wired with Placeholder
- **Master Status:** Proposed Visual Design — Becomes Master Reference if Approved

## Behavior Summary

nearby-monster healer; special: Chocolate Swamp

## Short Design Summary

## Fixed Visual Invariants

Preserve exactly lavender #c98bd6, caramel #c98245, cream #fff3df, mint #72d6aa; a wobbling lavender custard cup with a caramel cap sliding slightly to one side, tiny spoon tucked behind, watery worried eyes, and two jelly nub feet; palette soft trapezoid cup with tilted caramel cap; heal; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Fixed Visual Invariant Block

Preserve exactly lavender #c98bd6, caramel #c98245, cream #fff3df, mint #72d6aa; a wobbling lavender custard cup with a caramel cap sliding slightly to one side, tiny spoon tucked behind, watery worried eyes, and two jelly nub feet; palette soft trapezoid cup with tilted caramel cap; heal; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Master-Reference Prompt

- **Google Flow Filename:** `master_monster_lost_pudding.webp`
- **Intake:** `art-review/incoming/monsters/lost_pudding/master_monster_lost_pudding.webp`

Create an original full-body master reference for Lost Pudding. Preserve exactly lavender #c98bd6, caramel #c98245, cream #fff3df, mint #72d6aa; a wobbling lavender custard cup with a caramel cap sliding slightly to one side, tiny spoon tucked behind, watery worried eyes, and two jelly nub feet; palette soft trapezoid cup with tilted caramel cap; heal; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Present an oversized chibi head, tiny body, rounded simple silhouette, expressive funny face, one memorable visual gimmick, bright pastel candy palette, clean flat blocking, minimal cel shading, upper-left highlights, and thick smooth chocolate #2b1a14 outlines. Show a left-facing gameplay identity view plus a clean silhouette callout. No labels, copied character, realism, gritty texture, or dense detail.

## Left-Facing Gameplay Sprite Prompt

- **Google Flow Filename:** `monster_lost_pudding_left.webp`
- **Intake:** `art-review/incoming/monsters/lost_pudding/monster_lost_pudding_left.webp`
- **Final Production Path:** `/assets/final/monster/lost_pudding.webp`

Create one original isolated left-facing 96 × 96 transparent WebP gameplay sprite for Lost Pudding. Preserve exactly lavender #c98bd6, caramel #c98245, cream #fff3df, mint #72d6aa; a wobbling lavender custard cup with a caramel cap sliding slightly to one side, tiny spoon tucked behind, watery worried eyes, and two jelly nub feet; palette soft trapezoid cup with tilted caramel cap; heal; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Match the approved master exactly while simplifying for tiny gameplay scale: oversized expressive head, tiny compact body, one strong funny visual gimmick, clear left-facing movement-ready stance, bright pastel candy colors, minimal cel shading, clean color blocks, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the ground contact stable at anchor 0.5, 0.82 with safe transparent margins. One monster only; no animation atlas, alternate direction, background, shadow, text, border, VFX, motion blur, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

## Runtime Contract

The reviewed source becomes the final one-frame production asset after validation. Phaser mirrors it horizontally for right-facing movement and uses code-driven bob, bounce, squash/stretch, hit flash/shake, and defeat fade.

## Negative Prompt

No copied character, multiple frames, atlas, right-facing source, up/down source, text, background, realistic anatomy, horror treatment, gritty texture, painterly rendering, dense detail, harsh black outline, or photorealism.

## Readability Checklist

- [ ] Silhouette, face, gimmick, and left-facing orientation read at 48 CSS pixels
- [ ] Master palette, material, outline, camera, light, scale, and contact point match
- [ ] 96 × 96 WebP has clean transparency and safe margins
- [ ] Exactly one gameplay sprite exists; no atlas assembly is required
