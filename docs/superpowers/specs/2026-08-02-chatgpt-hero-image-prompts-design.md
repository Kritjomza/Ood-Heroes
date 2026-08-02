# ChatGPT Hero Image Prompt Files Design

## Goal

Create 48 standalone Markdown prompt files in `art-prompts/heroes/prompt/`: eight image prompts for each of the six approved Odd Tower hero designs. The files must be directly usable in ChatGPT image generation and minimize character drift by making an approved master-reference image authoritative for every downstream image.

This task creates prompt text only. It does not generate images or alter production asset IDs, runtime code, manifests, or production paths.

## Deliverables

Each hero receives exactly these eight files:

1. `master_hero_<slug>.md`
2. `hero_<slug>_portrait.md`
3. `hero_<slug>_icon.md`
4. `hero_<slug>_collection_card.md`
5. `hero_<slug>_idle_a.md`
6. `hero_<slug>_idle_b.md`
7. `hero_<slug>_move_left_a.md`
8. `hero_<slug>_move_left_b.md`

The six slugs are `grilled_chicken`, `pink_chocolate_lizard`, `robot_jelly`, `tofu_rabbit`, `accountant_octopus`, and `samurai_bread`.

The folder also contains a `README.md`. The README is an instruction file and is not counted among the 48 image prompts.

## Master-Reference Workflow

The master prompt creates `master_hero_<slug>.webp`. The user reviews and approves that image before generating any variant.

Every downstream prompt begins with an explicit instruction to attach the approved `master_hero_<slug>.webp` to the ChatGPT request. The attached master is authoritative for identity. The prompt permits only pose, crop, and explicitly requested state changes; it forbids redesigning the silhouette, palette, materials, face, costume/body features, signature props, outline treatment, camera language, and optical scale.

If no approved master is attached, the variant prompt instructs ChatGPT to stop and request it instead of inventing a replacement design.

## File Format

Every prompt file is self-contained and includes:

- hero and image-purpose metadata;
- intended output filename;
- dimensions, WebP export, and transparency requirements;
- reference-image attachment instruction;
- complete Character Identity Lock copied from the current hero owner file;
- a copy-ready ChatGPT image prompt;
- negative constraints;
- a short consistency checklist.

The prompt text must not rely on the reader opening Style DNA or another prompt file. Cross-file links may be included for traceability but are not required to understand or execute a prompt.

## Image Contracts

- Master reference: neutral reference presentation suitable for locking the approved design; no gameplay production path.
- Portrait: 512 × 512, transparent WebP.
- Icon: 128 × 128, transparent WebP, readable at 48 CSS pixels.
- Collection card: 640 × 800, transparent WebP with no baked UI text.
- Gameplay sources: 96 × 96, transparent WebP, consistent optical scale, margins, baseline, and anchor at `0.5, 0.82`.

Gameplay source semantics and final atlas order are:

1. `idle_a` — neutral idle pose A
2. `idle_b` — subtle alternate idle pose B
3. `move_left_a` — left-facing movement contact pose A
4. `move_left_b` — left-facing movement passing pose B

Idle art remains neutral and unmirrored. Rightward movement is created by runtime mirroring of the left-facing movement art. ChatGPT must create one isolated image per prompt and must not generate a sprite sheet, contact sheet, atlas, multiple panels, or multiple variants in one image.

## Style and Originality Contract

All files preserve the approved Odd Tower direction: original cute pastel food-fantasy chibi characters, oversized expressive head/face language, tiny compact body, sticker-like graphic shapes, thick rounded dark-chocolate outline consistent with `#2b1a14`, minimal cel shading, upper-left light, transparent background when required, and strong readability at 48 pixels.

Prompts prohibit copied characters, franchise-specific features, pure-black outlines, photorealism, painterly texture, unrequested accessories, anatomy drift, palette drift, prop replacement, text, logos, watermarks, environment backgrounds, cast shadows, unsafe cropping, and alpha fringes.

## Validation

Validation confirms:

- exactly 48 `.md` image-prompt files plus one README;
- exactly eight prompt files for each approved hero slug;
- every variant references the correct master filename;
- every file contains dimensions, WebP requirements, identity lock, negative constraints, and output filename;
- gameplay files use the four approved state names and 96 × 96 transparent output;
- no prompt requests an assembled atlas or obsolete down/up/right directional source;
- no image is generated as part of this task.

## Compatibility

These are ChatGPT intake prompts only. They do not receive production asset IDs or change the authoritative 75-ID manifest. The generated gameplay source images remain review inputs; only the programmatically assembled hero atlas receives the existing production path.
