# Odd Tower Universal Style DNA

## Authority and status

This document is the approved creative foundation for the prompt library. It does not claim that final artwork exists. Every character and environment master derived from it is **Proposed Visual Design — Becomes Master Reference if Approved**.

## Original visual language

Odd Tower uses original compact food-fantasy chibi characters built from clean, graphic shapes. Heads or face-bearing body masses occupy roughly 55–65% of character height; limbs are short and readable; one asymmetric signature feature distinguishes each silhouette. The supplied visual reference informs only broad principles—bold chibi proportions, expressive geometry, saturated candy color, and clean outline rhythm. Do not reproduce any referenced character, costume, prop, hairstyle, face, or composition.

## Tiered rendering system

- **Gameplay sprites:** flat graphic construction, 3–5 dominant colors, one broad shadow, one controlled highlight, no microtexture, strong negative space.
- **Portraits/icons:** same master design, closer crop, clearer expression, one extra highlight layer, no redesign.
- **Collection cards:** same master design and palette, dynamic pose and restrained presentation particles; no new costume pieces.
- **Environment:** lower contrast/detail density than characters; readable paths, collision edges, and hazard footprints.
- **VFX:** separate transparent assets; limited palette, obvious footprint, no character unless required.

## Shared palette

| Role | Hex guidance | Use |
| --- | --- | --- |
| Chocolate outline | `#2b1a14` | Primary rounded linework; never pure black |
| Deep cocoa shadow | `#4a2b24` | Interior separators and deepest shadow |
| Cream light | `#fff3df` | Warm highlight and UI negative space |
| Honey gold | `#f3b64b` | Rewards, success, warm emphasis |
| Candy coral | `#f36f78` | Attack urgency and playful warmth |
| Mint | `#72d6aa` | Healing, safety, friendly effects |
| Sky candy | `#6fc9e8` | Cold, information, movement |
| Grape candy | `#a77bd8` | Magic, trickster, epic rarity |
| Common | `#b8c4b1` | Neutral rarity support |
| Rare | `#57a9df` | Rare frames/glows |
| Epic | `#a86bd4` | Epic frames/glows |
| Legendary | `#f3b63f` | Legendary frames/glows |

Each asset may add local food colors, but character masters keep 3–5 dominant colors plus outline and cream highlight.

## Linework

Use smooth, rounded, hand-drawn-looking graphic linework based on `#2b1a14`. At gameplay scale, exterior contours are approximately 6–8% of a 96 px frame height; interior lines are approximately half that weight. Corners are softened, line joins are round, and tiny enclosed shapes are avoided. No pure black, thin sterile vector line, scratchy ink, or double outline.

## Camera and perspective

- Gameplay: orthographic three-quarter top-down, approximately 35–40 degrees downward, face still visible.
- Portrait/icon/card: front three-quarter view derived from the same construction, never a different character design.
- Tiles: orthographic top-down aligned to a 32 px logical grid.
- Never use isometric diamond projection, side-view platformer framing, dramatic wide-angle lenses, or camera rotation between variants.

## Lighting and shadow

A single soft key light comes from upper left. Use one broad lower-right shadow region and one compact upper-left highlight. Transparent character/item/VFX assets have no baked environment and no cast shadow unless the exact contract requests one. When a gameplay contact shadow is generated separately, use a soft cocoa oval centered on the fixed ground-contact point.

## Scale and readability

- Small hero/monster gameplay frame: design for recognition at 48 CSS px while authored inside 96 px cells.
- Small icon: face/signature feature must remain legible at 48 CSS px.
- Portrait: clean safe area around head and signature prop.
- Environment: characters must remain the highest-contrast elements.
- Avoid details narrower than roughly 3 px at the 96 px source-cell scale.

## Master invariant contract

Every downstream prompt must restate the approved master’s:

1. silhouette and height class;
2. body material and surface treatment;
3. main/secondary palette;
4. eye, mouth, and facial language;
5. body proportions;
6. weapon or signature prop;
7. costume/body features and permanent markings;
8. topping/particle placement;
9. outline treatment;
10. camera and scale;
11. upper-left lighting;
12. ground-contact point and anchor;
13. mobile-readability rule.

Only pose, expression, deformation, and action-specific particles may change in an animation variant.

## Export contract

Wired assets export as WebP at the exact manifest dimensions and replacement path. Use transparency exactly where Inventory A says Transparent. Preserve listed anchors and atlas groups. Do not add padding changes between frames. Pending assets have no production path, dimensions, anchor, or atlas group until code defines them.

## Universal copy-ready negative prompt

No text, letters, words, numbers, fake writing, labels, logos, watermark, signature, UI text, copyrighted character, copied costume, copied prop, photorealism, realistic human anatomy, horror, gore, gritty violence, painterly background, cinematic perspective, side-view platformer angle, isometric camera, camera rotation, pure black outlines, thin sterile vector lines, scratchy ink, excessive micro-details, visual clutter, muddy color, over-rendering, complex gradients, inconsistent lighting, cropped body, missing limbs, extra limbs, duplicated accessories, altered costume, altered weapon, altered body material, inconsistent face, inconsistent proportions, unwanted ground plane, baked environment, cast shadow unless requested.

### Animation addendum

No character redesign, costume change, weapon change, palette shift, size shift, camera-angle change, perspective change, different facial structure, different topping placement, new accessory, missing accessory, drifting anchor, changing cell padding, uneven frame scale, or non-loopable timing.

## Conflict policy

- **C1:** the active lightweight runtime contract overrides prior hero and monster multi-direction animation suggestions: heroes use four static gameplay states and monsters use one left-facing static source.
- **C2:** wired generic map slots remain production assets; unwired zones remain provisional.
- **C3:** Jumping Sauce Bag remains the production name.
- **C4–C9:** pending HUD, boss, portal, skills, and EXP art remain provisional until runtime contracts exist.
