# Online Room Tower Gate Redesign

## Goal

Replace the legacy Online Shared Combat Sandbox room screen with a cohesive, adventurous room-creation and room-joining experience that feels native to Odd Tower's cute, tactile RPG world. Remove development-phase language, preserve networking behavior, and make the transition from lobby entry to live combat feel continuous.

## Scope

The redesign applies to `apps/client/src/ui/OnlineLobby.tsx`, its supporting styles, and the transition from the online lobby into the existing multiplayer game view. It preserves the current create, join, busy, error, back, and connection contracts. It does not change room networking, server authority, combat behavior, persistence, or database schemas.

## Direction: Toy Tower Gate

The page presents a small molded-plastic tower entrance rather than a generic form card. A large arched gate and party silhouettes establish the destination. The room controls feel like physical pieces attached to the gate: thick cocoa outlines, inset highlights, short downward shadows, and rounded toy-like surfaces.

The visual system extends the established website palette:

- Cream and warm paper form the page and reading surfaces.
- Cocoa outlines define every important object and control.
- Adventure gold identifies creating a room and opening a new expedition.
- Mint identifies joining an existing party.
- Sky blue creates atmospheric depth behind the tower.
- Coral and rarity purple appear only in flags, labels, and small accents.

## Content and Hierarchy

Remove “Phase 3,” “sandbox,” and the technical server-authority paragraph. Replace them with player-facing adventure language:

- Heading: “Gather at the Tower Gate”
- Supporting copy: “Create a new expedition or join your party with a room code.”
- Create path label: “Start an expedition”
- Join path label: “Join your party”
- Busy status: “Opening the gate…”

The information order is:

1. Tower destination and party atmosphere
2. Create or Join selection
3. Shared display name
4. Room code, visible only for Join
5. One dominant contextual action
6. Compact back navigation

Existing accessible action names `Create Room` and `Join Room` remain available to assistive technology and automated tests even when the visible labels become more thematic.

## Layout

### Desktop

Use an asymmetric two-column composition. The illustrated tower diorama occupies the larger left region; the room controls occupy a narrower right region. The gate, not a conventional header card, is the first visual thesis. The form panel is visibly attached to the tower composition rather than floating as an unrelated dashboard card.

### Mobile

Stack the arched tower above a compact control sheet. Keep the selected path, inputs, and primary action within comfortable thumb reach. Decorative clouds and flags may crop or simplify, but the destination, task, error state, and action remain visible.

### Short Landscape

Reduce decorative scenery and tower height while retaining the two-column structure where space permits. The form must fit without clipping and remain independently scrollable if necessary.

All interactive targets are at least 44 by 44 pixels. Safe-area insets are respected. English and Thai copy, long player names, and six-character room codes must reflow without fixed-width clipping.

## Components

### Tower Diorama

A CSS-authored layered scene uses an arched door, stone-plastic blocks, flags, clouds, stepping lights, and three abstract party silhouettes. It uses no unsupported gameplay claims and requires no new downloaded artwork. Decorative elements are hidden from assistive technology.

### Path Selector

Create and Join are a two-option segmented control using real buttons with selected-state semantics. Create uses gold; Join uses mint. Selection changes the contextual copy, visible fields, tower light, and primary action without navigating away.

### Room Form

Display name is shared across both paths. Room code appears only for Join and retains uppercase presentation, six-character length, autocapitalization, and spellcheck behavior. The primary action is a full-width tactile button. Enter submits the active path when its required fields are valid.

### Back Control

Back becomes a compact arrow-and-label control in the upper-left. It remains a real button, keeps the existing callback, and is visually subordinate to the room action.

### Status and Errors

Busy state disables duplicate actions, preserves readable text, and presents an inline `role="status"` message. Errors remain `role="alert"`, use danger color plus an icon/label, and are associated with relevant fields through `aria-describedby`.

## Interaction and Transition

On initial entry, the page layers arrive in a short sequence: atmosphere, tower, then controls. The tower settles once with a restrained soft bounce and its flags use a low-amplitude idle sway.

Switching paths slides and fades the form content over a short distance. The gate light changes between gold and mint. Focus moves only when initiated by keyboard selection; pointer interactions do not create unexpected focus jumps.

Submitting depresses the primary plastic button and starts the busy state. The tower doors open, stepping lights illuminate toward the doorway, and a warm light sweep expands across the page. The lobby remains mounted during the connection attempt. On successful connection, the light sweep becomes a brief full-frame veil and the existing multiplayer canvas appears beneath it, creating a continuous doorway transition. On failure, the doors close, the error ticket performs one restrained horizontal wobble, and focus moves to the error summary.

Motion is implemented with CSS transforms and opacity only. Under `prefers-reduced-motion: reduce`, idle movement stops and all entrance, switching, error, and connection effects become immediate or use a brief opacity fade.

## State and Data Flow

`OnlineLobby` owns only presentation state: selected path and transition phase. Display name and room code remain local controlled values. `onCreate`, `onJoin`, and `onBack` remain the external action boundary.

The existing `networkState.connection` continues to provide the source of truth for connecting and failure states. The parent `App` continues to decide when the online room replaces the lobby. A small route-level transition state may delay only the visual unmount long enough to complete the exit veil; it must never delay or alter the network operation itself.

No new persistent state, gameplay state, protocol field, or server request is introduced.

## Accessibility

- Use semantic headings, labels, fields, buttons, status, and alert regions.
- Use `aria-pressed` or equivalent selected-state semantics for Create and Join.
- Maintain visible high-contrast focus rings on every control.
- Do not rely on gold or mint alone; pair selected states with text, shape, and position.
- Preserve a logical keyboard order: Back, path selector, fields, primary action.
- Announce the busy state without repeatedly flooding the live region.
- Hide all scenery from the accessibility tree.
- Honor reduced motion and maintain readable contrast across all plastic surfaces.

## Testing and Verification

Automated component tests will cover:

- Default Create path and thematic copy without “Phase 3” or “sandbox”
- Switching to Join and conditionally revealing the room-code field
- Existing exact create and join callback payloads
- Busy state and duplicate-action prevention
- Error announcement and field association
- Keyboard-accessible path selection and submission
- Stable accessible names for existing integration and end-to-end contracts

Verification will include the focused online UI tests, TypeScript checks, linting for changed files, and a client build. Visual inspection will cover desktop, mobile portrait, and short landscape layouts in one bounded pass, followed by one correction pass if needed.

## Non-Goals

- No redesign of the preceding mode-selection screen
- No redesign of the in-combat HUD or Phaser world
- No networking, server, protocol, persistence, or database changes
- No new room discovery, matchmaking, passwords, player limits, or unsupported features
- No external art dependency

