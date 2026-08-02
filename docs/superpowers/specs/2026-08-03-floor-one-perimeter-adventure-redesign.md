# Floor 1 Perimeter Adventure Redesign

**Status:** Approved design awaiting written-spec review  
**Date:** 2026-08-03  
**Primary surface:** `apps/client/src/ui/tower/TowerHud.tsx` and the Floor 1 Phaser world  
**Mode:** Operate / Experience  

## Objective

Redesign Floor 1 as a mobile-portrait-first, bright handmade toy-box RPG scene. Preserve the current React, Phaser, multiplayer, combat, progression, and persistence contracts while making the HUD readable, the world navigable, the map useful, and the characters correctly scaled within the playfield.

Success means the player can immediately identify party health, the current objective, nearby threats, available actions, and their route through Floor 1 without the HUD or hero artwork obscuring play.

## Selected Direction

The approved composition is **A — Perimeter Adventure**. Compact tactile plaques occupy safe edges while the middle of the screen remains a clear gameplay stage. The current cream paper, cocoa outline, candy color, soft offset-depth, and character-first identity remains intact, with stronger contrast, denser RPG information hierarchy, and more authored map detail.

Mobile portrait is the primary authored composition. Landscape, tablet, and desktop are supported adaptations of the same hierarchy rather than independent interfaces.

## Scope

### In scope

- Recompose the Floor 1 HUD for mobile portrait, landscape, tablet, and desktop.
- Improve leader, party, floor progress, objective, action, session, tool, and respawn presentation.
- Make the minimap reflect live player coordinates and meaningful Floor 1 markers.
- Add a tappable expanded Floor 1 map with labels and an accessible close flow.
- Improve Floor 1 terrain, paths, zone boundaries, landmarks, visual depth, and character-to-world scale.
- Add purposeful HUD, action, combat, pickup, objective, and portal animation.
- Preserve keyboard, touch, reduced-motion, localization, multiplayer, and gameplay behavior.
- Add or update automated tests for new model and interaction behavior.

### Out of scope

- Database or persistence schema changes.
- New combat abilities, inventory mechanics, quests, rewards, enemies, or progression rules.
- Replacing authoritative server simulation or multiplayer state contracts.
- Adding unsupported controls or presenting future systems as usable.
- Redesigning non-Floor 1 application screens.

## Visual System

The redesign extends the existing Handmade Hero Gate system rather than replacing it.

- **Surfaces:** warm cream paper, painted wood and toy-plastic details, cocoa structural outlines, inset highlights, and soft downward shadows.
- **Action color:** Adventure Gold remains reserved for the strongest current action or objective state.
- **Status colors:** coral for danger, mint for healthy/positive state, sky blue for progress and navigation, purple for portal/odd magic. Every state also uses text, shape, or iconography.
- **Typography:** the existing rounded English/Thai-compatible stack, with tabular numerals for health, XP, latency, and rewards.
- **Icons:** consistent authored or library SVG icons. Emoji and Unicode glyphs will not serve as final interface icons.
- **Shapes:** compact plaques, ribbons, tickets, and a framed map rather than a field of identical cards.
- **Contrast:** essential text meets WCAG contrast targets on its actual surface; translucent white-on-world text is removed.

## Responsive Composition

### Mobile portrait

1. A compact leader plaque anchors to the top safe area. It contains hero portrait/fallback, level, name, HP, XP, and party-alive state.
2. Connection and pause controls occupy the plaque’s trailing edge and collapse to labeled icons at narrow widths.
3. A floor ribbon sits immediately below the leader plaque, showing floor name and objective progress. Secondary objective copy may collapse behind an explicit expand affordance on short viewports.
4. The middle remains free of persistent HUD chrome and is reserved for the player, enemies, landmarks, and interaction prompts.
5. The Odd Job tracker sits above the bottom controls and reduces to one line when space is constrained.
6. Four primary actions remain visible in a thumb-friendly bottom dock. No combat action is removed in portrait mode.
7. The minimap anchors above the dock on the opposite thumb side. It remains large enough to interpret and can expand on activation.
8. Inventory, auto-hunt, and map tools form a compact safe-edge rail. Locked tools remain clearly disabled and labeled.

### Mobile landscape and short viewports

The party plaque moves to the upper-left, the floor ribbon centers at the top, tools and minimap occupy the right edge, the quest tracker moves to the lower-left, and the action dock remains bottom-center. Nonessential supporting copy collapses before controls or state indicators.

### Tablet and desktop

The perimeter layout expands outward into available safe space. The party plaque may show companion rows, the quest tracker shows full target and reward details, and the minimap gains zone labels. The world remains the dominant visual surface; no central dashboard panel is introduced.

## HUD Components

### Leader and party plaque

- Uses the current party and leader model as its only source of truth.
- Displays exact current/max HP and XP, level, leader name, and alive/down party state.
- Uses stable hero-art bounds and the existing themed fallback when artwork is unavailable.
- Health and XP fills interpolate visually while their accessible values update immediately.
- Long English/Thai names truncate or wrap without pushing controls off-screen.

### Floor ribbon and objective tracker

- Shows Floor 1 title, mode, objective progress, target, and reward values already available in the HUD model.
- Objective completion triggers a brief flourish and settles back to rest.
- Empty targets render an honest neutral state, not fabricated content.

### Action dock

- Keeps Bonk, Odd Skill, Snack, and Interact visible in portrait.
- Each action supports ready, pressed, cooldown, disabled, keyboard-focus, and touch states.
- Keyboard bindings remain visible where space allows and available to assistive text everywhere.
- Press feedback is visual-only and never delays or alters gameplay input.

### Tool rail and session controls

- Pause, leave-room, auto-hunt, expanded-map, and locked inventory behavior remains wired to current callbacks and state.
- Auto-hunt shows both pressed state and textual state.
- Disabled controls remain legible, unfocusable where appropriate, and explain their state through accessible labels.

### Respawn state

- Preserves the blocking respawn overlay and countdown.
- Uses an opaque-enough warm backdrop, clear recovery copy, and a reduced-motion-safe return transition.

## Functional Minimap and Expanded Map

The minimap becomes a controlled component rather than a static decoration.

Inputs:

- authoritative Floor 1 dimensions and zone/landmark objects;
- live local-player world coordinates;
- portal lock state;
- guardian state;
- current target or objective markers when those coordinates exist.

Projection converts world coordinates to clamped normalized map coordinates. The local player marker updates with movement. Static markers are derived once from the Floor 1 data; live markers update only when relevant state changes.

The compact map shows zone silhouettes, traversable routes, local player direction, portal, guardian, camp, and useful landmarks. Marker meaning is communicated by shape and accessible labels as well as color. Activating the minimap or Map tool opens an expanded map layer with zone names, a legend, objective text, and a visible close control. Escape, backdrop activation, and the close control dismiss it; focus returns to the opener.

## Floor 1 World Presentation

- Retain the 64 × 64 tile authoritative map, collision, slow-terrain, spawn, portal, and guardian placement.
- Replace broad flat zone rectangles with layered zone fields, readable borders, route/path treatment, and transitions that expose navigable space.
- Use deterministic decoration generation so tests and multiplayer clients produce stable layouts.
- Keep decorative details outside collision and important interaction footprints.
- Improve camp, swamp, forest, arena, and portal identities with distinct subject-world materials and color roles.
- Add grounded shadows and depth ordering for heroes, enemies, landmarks, and tall foreground details.
- Scale hero and boss visuals against tile size and collision footprints. Artwork may exceed its body for personality but must not obscure nearby gameplay or imply a false collision area.
- Landmark labels use short, high-contrast plaques and hide at zoom levels where they would overlap excessively.

## Motion and Game Feel

Motion attaches to existing state and gameplay events and always returns to rest.

- **Ambient:** subtle character idle, gentle portal shimmer, and restrained environmental movement.
- **Small:** button press/squash, minimap player pulse, pickup pop, and short progress interpolation.
- **Medium:** ability confirmation, damage number pop, hero hit flash, and modest decaying camera trauma.
- **Large:** guardian defeat, objective completion, and portal unlock flourish.

Hit effects do not mutate physics transforms or block input. Camera shake affects the visual camera only, decays smoothly, and is reserved for meaningful impact. `prefers-reduced-motion` removes looping and spatial movement while preserving immediate state feedback.

## Architecture and Data Flow

- `towerHudModel` remains the presentation-model boundary between game/session state and React.
- New minimap projection helpers remain pure and independently testable.
- `TowerHud` owns HUD composition and open/closed expanded-map state; it receives behavior through explicit callbacks.
- `TowerMinimap` receives projected player and world state through props and emits an open request. It does not query game globals.
- The game bridge supplies local player coordinates and relevant Floor 1 state without changing server authority.
- `FloorOneRenderer` owns world-only rendering and visual feedback. It does not own React HUD state or gameplay rules.
- HUD updates remain event/state driven; no new per-frame React polling loop is introduced.

## Accessibility and Input

- All interactive controls are semantic buttons with at least 44 × 44 CSS-pixel targets.
- Keyboard focus is conspicuous against every surface.
- Expanded map focus is trapped while open and restored on close.
- Critical status and map information has concise accessible text.
- Controls remain usable with keyboard, pointer, and touch.
- Safe-area insets protect controls on notched devices.
- Color is never the only indicator for health, readiness, lock, danger, or objective state.
- English, Thai, long player names, and large numeric values reflow without clipped essential content.

## Error and Edge States

- Missing hero art uses the existing illustrated fallback; browser broken-image chrome never appears.
- Missing target coordinates omit the target marker and keep textual objective information.
- Disconnected or high-latency state remains visible and readable.
- Zero party members, defeated party members, zero maximum values, and respawn countdowns avoid division errors and misleading fills.
- Locked inventory remains disabled; it is not simulated as functional.
- Compact map markers are clamped to map bounds.

## Testing Strategy

Implementation follows test-driven development.

1. Add failing unit tests for live minimap coordinate projection, clamping, marker derivation, portal/guardian state, and zero-dimension safeguards.
2. Add failing component tests for expanded-map open/close, focus restoration, action visibility in portrait, auto-hunt pressed state, callbacks, and accessible labels.
3. Add failing renderer/model tests for deterministic decoration, collision-safe placement, and scale/depth contracts where those behaviors are represented as pure data.
4. Implement the minimum production changes needed to pass each test, then refactor while green.
5. Run the complete client test suite, TypeScript build, and existing relevant end-to-end tests.
6. Perform one batched visual inspection at mobile portrait, mobile landscape, and desktop, fix material issues together, and confirm in one final round.
7. Verify real movement, minimap updates, map expansion, actions, interaction, pause, leave, auto-hunt, respawn, portal, and guardian states in the running game.

## Acceptance Criteria

- Mobile portrait presents all four primary actions without hiding or overlapping them.
- The central gameplay area is not persistently obscured by HUD panels.
- The local player marker moves correctly across the minimap using real world coordinates.
- Portal, guardian, camp, landmarks, and available target markers reflect real Floor 1 state.
- The expanded map opens and closes through touch, pointer, keyboard, Escape, and backdrop behavior, with correct focus restoration.
- Health, XP, objective, connection, auto-hunt, interaction, pause, leave, respawn, and lock states remain functional.
- Character rendering no longer dominates the viewport or misrepresents collision scale.
- Floor zones, routes, and important landmarks are distinguishable during play.
- Reduced-motion mode removes nonessential motion.
- No persistence, multiplayer, combat, or existing application-route regression is introduced.
- Automated tests, type checks, build, and bounded cross-viewport visual verification pass.

## Implementation Boundary

The implementation may change Floor 1 HUD components/styles, pure HUD models, bridge/view-model wiring, Floor 1 renderer/model code, and directly related tests. Any discovered need for database changes, new authoritative gameplay behavior, or broad application-shell redesign requires a separate approved design.
