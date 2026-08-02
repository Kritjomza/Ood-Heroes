# Odd Tower Sticker Adventure Tower UI Design

## Status

Approved visual direction. This specification covers the shared Local Prototype and Online Multiplayer Tower presentation. It does not replace the approved single-sprite character or typed Floor 1 gameplay architecture.

## Goal

Turn the Tower view into a readable, playful 2D RPG screen inspired by the supplied retro MMO reference. The environment uses layered pixel-art language while the interface uses modern cartoon sticker panels. The result must feel cute, funny, dimensional, and recognizably Odd Tower rather than copying the reference assets.

## Visual Direction

The world uses crisp pixel-shaped textures, restrained detail variation, stepped shorelines, readable silhouettes, and three depth bands: ground, gameplay objects, and foreground occlusion. Characters keep one right-facing world image, horizontal mirroring, and runtime squash-and-stretch. Soft contact shadows, ambient particles, biome tint, subtle vignette, and landmark lighting add depth without changing physics.

The HUD uses cream paper surfaces, dark chocolate outlines, asymmetric rounded corners, offset sticker shadows, mint/pink/yellow accents, playful microcopy, and small comic reactions. Important gameplay colors remain consistent: green for health/safe, blue-purple for experience/magic, amber for progress, red for danger, and violet for portals.

## Shared HUD Architecture

Local and Online modes use one `TowerHud` composition and one token set. Mode-specific adapters convert their existing bridge/network state into a shared typed view model. HUD elements subscribe to state changes and do not inspect Phaser objects directly.

The layout is anchored to viewport edges with safe-area insets and fluid sizes. Critical controls remain usable at desktop 16:9, ultrawide, tablet landscape, and compact mobile landscape. Portrait mode may condense secondary information, but must keep movement, primary action, Auto Hunt, health, and objective visible.

## Desktop Layout

### Top left: party card

- Leader portrait, level badge, hero name, HP, and EXP.
- Compact follower pips show alive, hurt, or defeated state.
- HP and EXP use layered tracks with readable numeric labels.
- The card may briefly wobble on damage while honoring reduced-motion settings.

### Top center: floor objective

- `Floor 1 · The Odd Beginning` location plaque.
- Guardian eligibility/progress meter.
- During the boss encounter this area transforms into the Guardian health bar and phase label.

### Top right: session capsule

- Local or Online state, connection light, player count, sound controls, and pause.
- Network diagnostics remain available in a compact expandable details area rather than occupying the primary play space.

### Right action rail

- A visibly locked inventory slot reserved for the future inventory feature, plus Auto Hunt and map visibility controls.
- Buttons use icons plus accessible labels and retain keyboard focus styling.
- Auto Hunt visually distinguishes off, hunting, retreating, and recovering states.

### Bottom center: action dock

- Four slots: primary attack, special, recovery, and interact.
- Keyboard hints, disabled states, cooldown masks, and interaction availability.
- Existing gameplay remains authoritative; unavailable actions appear visibly locked and do not imply functional mechanics.

### Bottom left: objective and event feed

- Current objective, short combat/reward messages, and collapsible help.
- This replaces a large chat-like panel and avoids covering the world.

### Bottom right: minimap

- Derived from the typed 64×64 Floor 1 definition.
- Shows zone colors, player, camp, Guardian, portal, and discovered landmarks.
- It is presentation-only and does not become a second navigation source of truth.

## World Presentation

`FloorOneRenderer` remains driven by `FLOOR_ONE_MAP`. Rendering is split into focused helpers for ground/biomes, slow terrain, landmarks, ambient dressing, encounter presentation, portal presentation, and optional debug overlays.

Procedural pixel-style textures provide an attractive fallback while final art is absent. Texture generation is deterministic and cached. Details never occupy collision tiles in a way that implies false blocking. Slow terrain must remain visually distinct. Camp exits, Guardian route, and portal direction use color, paths, light, and silhouettes as guidance.

Depth ordering is explicit:

1. Base ground and biome texture.
2. Ground detail and slow-terrain edges.
3. Characters, enemies, buildings, landmarks, and contact shadows.
4. Decor-above/occlusion objects.
5. Ambient particles and world prompts.
6. React HUD and overlays.

## Character and World Labels

Local, remote, follower, monster, NPC, add, and Guardian visuals retain stable roots. Shadows and sprite deformation are visual children only. Nameplates use compact faction colors and scale down at distance. Labels must not overlap the top HUD when the camera approaches map bounds.

## Encounter and Portal States

Guardian presentation includes a large shared health bar, phase chip, readable frontal/cold/add telegraphs, enrage color change, and contribution feedback. Telegraph visuals reflect authoritative timing and do not alter hit logic.

After defeat, the portal changes from sealed violet stone to a lit, animated doorway. When an eligible player enters interaction range, the bottom action dock highlights the interact slot and displays `E · Enter next floor`. Completion remains manual and reward idempotency remains server-authoritative.

## Responsive and Accessibility Requirements

- Minimum interactive target: 44×44 CSS pixels.
- UI respects `env(safe-area-inset-*)`.
- Text remains readable over bright and dark biomes.
- Information is not communicated by color alone.
- Keyboard focus is strongly visible.
- Reduced-motion mode disables wobble, bounce, and nonessential particles.
- Mobile landscape keeps joystick and actions on opposite sides without overlap.
- Decorative HUD elements use no pointer events; buttons remain interactive.

## Implementation Boundaries

- Reuse React, CSS, Phaser, and inline SVG/CSS icons; add no heavy UI dependency unless a concrete need appears.
- Preserve the shared Floor 1 collision/navigation data and existing gameplay semantics.
- Preserve unrelated uncommitted work.
- Do not modify `.git` or run Git commands.
- Do not replace the single-sprite contract with atlases or directional pose files.
- Missing final art must degrade to deliberate procedural fallback art.

## Verification

Automated coverage will validate the shared HUD view model, mode adapters, minimap projection, responsive class/state output, and renderer helper invariants. Existing movement, map, collision, navigation, guardian, portal, protocol, and asset tests must continue to pass.

Manual browser QA will cover Local and Online at desktop 1920×1080, compact landscape 915×412, and one portrait viewport. Checks include safe areas, HUD overlap, one-canvas lifecycle, left/right sprite behavior, slow terrain readability, Guardian states, portal interaction, keyboard focus, and reduced motion. If local authentication services are unavailable, the exact blocker will be reported rather than counted as a pass.

## Acceptance Criteria

- Local and Online Tower screens visibly share the Sticker Adventure system.
- The layout matches the reference's useful information hierarchy without copying its assets.
- Floor 1 reads as a layered pixel-style environment rather than colored graybox rectangles.
- HUD remains readable and non-overlapping across the required viewports.
- Single-sprite animation and authoritative collision remain intact.
- Guardian and manual portal flow have clear visual states.
- Typecheck, lint, production build, and relevant tests pass.
- Final report lists all files touched, preserved unrelated work, actual verification results, missing art, limitations, and confirms no Git commands were run during this work.
