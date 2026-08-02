# Odd Tower Pocket Adventure Post-Login UI

## Purpose

Redesign the complete authenticated Odd Tower interface as a cohesive, mobile-first web-game experience. The visual system combines a Pocket Adventure Board foundation with restrained molded-plastic controls and sticker-book treatments where collection and reveal interactions benefit from them.

The redesign must preserve existing authentication behavior, server APIs, authoritative mutations, persistence semantics, and React screen ownership.

## Product priorities

1. Mobile portrait is the primary play context.
2. Desktop and tablet are secondary but fully supported.
3. Players must reach Home, Heroes, Summon, Team, and Account through persistent navigation.
4. RPG growth information must be complete and quickly scannable.
5. Derived UI details are permitted when computed exclusively from authoritative bootstrap data.
6. Motion must communicate game state and remain smooth on mobile hardware.

## Visual direction

### Pocket Adventure Board

The shared shell resembles a compact illustrated adventure board rather than a conventional web dashboard. Surfaces use solid color fields, soft molded highlights, directional shadows, and occasional sticker outlines. Depth comes from material treatment, never haphazard gradients.

### System colors

- Home: mango and sky.
- Heroes: lilac and berry.
- Summon: deep violet and electric peach.
- Team: mint and ocean.
- Account: cream and coral.

Each system uses its color as a stable navigation and orientation signal. Text and status meaning must never rely on color alone.

### Material hierarchy

- Navigation and high-frequency controls: molded plastic.
- Hero portraits, unlocks, and summon results: die-cut stickers.
- Large content regions: matte adventure-board surfaces.
- Account and save information: passport-like sheets with restrained depth.

No emoji may stand in for interface icons or game artwork. Navigation and utility symbols use a consistent authored SVG set. Existing hero assets remain authoritative.

## Application shell

### Mobile

A persistent safe-area-aware bottom tab bar contains Home, Heroes, Summon, Team, and Account. Every tab includes an icon and a one-line label. The active tab rises slightly from the molded rail and adopts its system color.

The top player strip contains:

- Display name.
- Gold, gems, and upgrade jelly when present.
- Compact save-health status.
- Contextual screen title when required.

### Desktop

At desktop widths, bottom navigation becomes a compact left adventure rail. Tab order, colors, labels, and semantics remain identical. Content expands without changing the information hierarchy.

### Navigation behavior

The screen model remains owned by `PersistentShell`. Switching tabs preserves server-backed state and uses a short directional transition. The transition must not block interaction longer than 220 ms and must degrade to an opacity-only change under reduced motion.

## Loading and recovery

Loading is the first implementation slice and establishes the motion language.

### Visual

A small tower mascot assembles from three sticker-like layers. A flag movement and traveling window light indicate ongoing work. Loading copy reflects the current phase:

- Opening your tower.
- Gathering your heroes.
- Counting your treasure.
- Restoring your adventure.

### State model

- `auth-loading`: restoring the local authentication session.
- `bootstrap-loading`: fetching or initializing player data.
- `oauth-restoring`: completing Google OAuth.
- `mutation-loading`: a localized action is in flight.
- `failed`: recovery action is available.

Loading animation never predicts success. A failed bootstrap presents the same scene with a stuck drawbridge, a clear explanation, and a Retry action. Reduced motion uses a quiet window-light pulse with no assembly or translation.

## Home

Home is an expedition dashboard, not a grid of equal feature cards.

The active team is the visual anchor. Solo and online play are the dominant actions. Supporting modules show:

- Pending AFK rewards.
- Collection ownership: owned heroes divided by total definitions.
- Current summon pity and affordable pull count.
- Next actionable hero upgrade.
- Active team occupancy and relevant progression prompt.

Derived recommendations must be deterministic and must not invent stats or rewards.

## Hero Collection

The collection behaves as a sticker album with dense RPG information.

### Summary

- Owned count and total hero definitions.
- Collection completion percentage.
- Role distribution among owned heroes.
- Count of heroes ready for a star upgrade.

### Controls

Filters support ownership, rarity, role, level, team status, and upgrade readiness. Filters remain keyboard accessible and collapse cleanly on narrow screens.

### Hero entries

Owned heroes display portrait, name, role, rarity, level, stars, shard progress, and active-team status. Locked heroes use a deliberate silhouette treatment and visible ownership wording. Rarity is represented by text and shape in addition to color.

## Hero Detail

Hero detail prioritizes progression:

- Portrait, name, rarity, and role.
- Level and total experience where available.
- Current stars.
- Shards held and shards needed for the next upgrade.
- Active-team position.
- Upgrade affordability and the exact missing requirement.

The upgrade action uses a localized pending state. Success is reflected in refreshed authoritative data rather than a fabricated preview.

## Summon

Summon uses a compact capsule-machine stage.

Before pulling, players can see:

- Banner name.
- Gem cost.
- Current gem balance.
- Affordable pull count.
- Pity progress and guarantee threshold.
- Exact information currently supplied by the backend; no unsourced odds are displayed.

### Reveal sequence

1. Charge: the capsule control compresses and the machine light fills.
2. Reveal: a hero silhouette appears after the server returns a successful result.
3. Arrival: the hero sticker settles into view; duplicates visibly convert to shards.

The sequence targets 1.2–1.8 seconds, may be skipped after it starts, and has a reduced-motion crossfade. Insufficient currency and network failure remain in the summon context and explain recovery.

## Team Management

Team management uses a formation board with three ordered slots above the roster.

- Locked, empty, filled, and selected states are explicit.
- Selecting a hero settles its sticker into the next available slot.
- Selecting an active hero removes it.
- Save remains disabled when the formation is invalid or unchanged.
- Unlock requirements show exact hero-count and gold conditions.

Derived summaries include average team level, total stars, role composition, occupied slots, and duplicated-role warnings. These are informational and do not modify combat calculations.

## Account

Account uses a player-passport composition and includes:

- Display name.
- Guest or protected account status.
- Google-link protection state.
- Save health and queue depth when relevant.
- Clear protection, sign-out, and recovery actions supported by the existing implementation.
- Technical identifiers inside a secondary disclosure rather than the primary hierarchy.

## AFK rewards and persistence feedback

AFK rewards appear as a peel-open parcel sheet. Rewards are itemized before collection. The collect action uses authoritative mutation state and closes only after refresh.

Save feedback remains continuously available but unobtrusive. Healthy save state is compact. Paused or degraded persistence expands into actionable wording and never relies on a colored dot alone.

## Component boundaries

`PersistentShell` continues to own authentication handoff, player bootstrap, navigation state, global errors, global loading, persistence feedback, and mutation orchestration.

Reusable presentation components should cover:

- `AdventureNav`
- `PlayerStrip`
- `TowerLoader`
- `PlasticButton`
- `CurrencyChip`
- `HeroSticker`
- `ProgressTrack`
- `RoleBadge`
- `RarityBadge`
- `ScreenHeader`
- `GameEmptyState`
- `GameErrorState`

A pure derived-view-model module computes:

- Collection completion.
- Role distribution.
- Affordable summon count.
- Upgrade-ready heroes.
- Average team level.
- Total team stars.
- Occupied team slots.

Derived results are never persisted as truth.

## Motion language

The shared physical vocabulary is:

- Controls compress.
- Tabs lift.
- Stickers settle.
- Rewards peel.
- Progress lights travel.

UI transitions use exponential ease-out. There are no bouncy overshoots, universal hover scaling, animated gradients, or repeated scroll-triggered reveals. Focus indicators appear instantly. Animations use transform, opacity, clip path, or shadow and avoid layout-triggering properties.

## Responsive and accessibility requirements

- Verify at 320, 375, 414, 768, 1280×800, and 1440×900.
- Respect device safe areas and touch targets of at least 48 CSS pixels.
- Prevent horizontal scrolling.
- Keep every interactive label on one line.
- Support keyboard navigation and visible focus order.
- Use semantic buttons, headings, labels, progress descriptions, and live regions.
- Pair every color-coded state with text, iconography, shape, or pattern.
- Honor `prefers-reduced-motion` across all authored motion.
- Ensure game-critical text meets WCAG contrast requirements.

## Error and edge states

Every system must support loading, empty, error, unaffordable, disabled, pending, and success-reflected-in-data states. Long hero names, zero currencies, zero owned heroes, a full collection, incomplete teams, maximum pity, degraded saves, and guest/protected account variants must not break layout.

## Verification strategy

Automated tests cover:

- Persistent navigation and active-tab semantics.
- Loading phases, retry behavior, and reduced-motion fallbacks.
- Derived collection, summon, and team calculations.
- Hero ownership and rarity labels independent of color.
- Valid, invalid, unchanged, and locked team formations.
- Summon success, duplicate, unaffordable, busy, and failure states.
- Account variants and save-status wording.
- Existing OAuth, persistence, mutation, and player-store behavior.

Visual verification uses one bounded desktop-and-mobile screenshot pass, one consolidated correction pass, and at most one confirmation pass.

## Out of scope

- New server APIs or database fields.
- Changes to authentication behavior.
- New combat formulas, hero stats, currencies, quests, or rewards.
- Invented summon odds or commercial claims.
- Replacing the existing hero asset pipeline.
