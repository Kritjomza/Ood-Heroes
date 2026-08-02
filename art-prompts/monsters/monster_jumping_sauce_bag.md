# Jumping Sauce Bag Production Prompts

> **Active gameplay contract:** one right-facing `world.webp`; older directional wording below is migration history.

## Active World Image Prompt

- Filename: `monster_jumping_sauce_bag_world.webp`
- Production: `/assets/game/monsters/jumping_sauce_bag/world.webp`

Create one isolated right-facing 96 × 96 transparent WebP world image of the approved Jumping Sauce Bag, preserving its exact packet silhouette, sauce palette, face, limbs, markings, chocolate outline, and orthographic three-quarter top-down camera. Anchor 0.5,0.82; light neutral movement-ready stance. One monster only; no sheet, alternate pose, shadow, background, text, blur, or copied design.

## Monster Identity

- **Parent Asset ID:** `monster.jumping_sauce_bag`
- **Implementation:** Wired with Placeholder
- **Master Status:** Proposed Visual Design — Becomes Master Reference if Approved

## Behavior Summary

fast low-HP attacker; special: Spicy Sauce Forest

## Short Design Summary

## Fixed Visual Invariants

Preserve exactly orange #ed8651, chili red #d94c55, cream #fff3df, cocoa #6b3b2b; a crinkled upright orange sauce pouch with sealed zigzag top, two springy folded packet corners as legs, tiny nozzle-like mouth, wide overconfident eyes, and one sauce droplet marking; palette narrow packet diamond with spring corners; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Fixed Visual Invariant Block

Preserve exactly orange #ed8651, chili red #d94c55, cream #fff3df, cocoa #6b3b2b; a crinkled upright orange sauce pouch with sealed zigzag top, two springy folded packet corners as legs, tiny nozzle-like mouth, wide overconfident eyes, and one sauce droplet marking; palette narrow packet diamond with spring corners; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Master-Reference Prompt

- **Google Flow Filename:** `master_monster_jumping_sauce_bag.webp`
- **Intake:** `art-review/incoming/monsters/jumping_sauce_bag/master_monster_jumping_sauce_bag.webp`

Create an original full-body master reference for Jumping Sauce Bag. Preserve exactly orange #ed8651, chili red #d94c55, cream #fff3df, cocoa #6b3b2b; a crinkled upright orange sauce pouch with sealed zigzag top, two springy folded packet corners as legs, tiny nozzle-like mouth, wide overconfident eyes, and one sauce droplet marking; palette narrow packet diamond with spring corners; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Present an oversized chibi head, tiny body, rounded simple silhouette, expressive funny face, one memorable visual gimmick, bright pastel candy palette, clean flat blocking, minimal cel shading, upper-left highlights, and thick smooth chocolate #2b1a14 outlines. Show a left-facing gameplay identity view plus a clean silhouette callout. No labels, copied character, realism, gritty texture, or dense detail.

## Left-Facing Gameplay Sprite Prompt

- **Google Flow Filename:** `monster_jumping_sauce_bag_left.webp`
- **Intake:** `art-review/incoming/monsters/jumping_sauce_bag/monster_jumping_sauce_bag_left.webp`
- **Final Production Path:** `/assets/final/monster/jumping_sauce_bag.webp`

Create one original isolated left-facing 96 × 96 transparent WebP gameplay sprite for Jumping Sauce Bag. Preserve exactly orange #ed8651, chili red #d94c55, cream #fff3df, cocoa #6b3b2b; a crinkled upright orange sauce pouch with sealed zigzag top, two springy folded packet corners as legs, tiny nozzle-like mouth, wide overconfident eyes, and one sauce droplet marking; palette narrow packet diamond with spring corners; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Match the approved master exactly while simplifying for tiny gameplay scale: oversized expressive head, tiny compact body, one strong funny visual gimmick, clear left-facing movement-ready stance, bright pastel candy colors, minimal cel shading, clean color blocks, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the ground contact stable at anchor 0.5, 0.82 with safe transparent margins. One monster only; no animation atlas, alternate direction, background, shadow, text, border, VFX, motion blur, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

## Runtime Contract

The reviewed source becomes the final one-frame production asset after validation. Phaser mirrors it horizontally for right-facing movement and uses code-driven bob, bounce, squash/stretch, hit flash/shake, and defeat fade.

## Negative Prompt

No copied character, multiple frames, atlas, right-facing source, up/down source, text, background, realistic anatomy, horror treatment, gritty texture, painterly rendering, dense detail, harsh black outline, or photorealism.

## Readability Checklist

- [ ] Silhouette, face, gimmick, and left-facing orientation read at 48 CSS pixels
- [ ] Master palette, material, outline, camera, light, scale, and contact point match
- [ ] 96 × 96 WebP has clean transparency and safe margins
- [ ] Exactly one gameplay sprite exists; no atlas assembly is required
