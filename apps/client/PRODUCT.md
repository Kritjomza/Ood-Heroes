# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual hero-collector players using a mobile-first web game across phones, tablets, laptops, and desktops. Players need to understand their current party, available tower floor, next meaningful action, rewards, and owned resources at a glance.

## Product Purpose

Odd Tower: Odd Heroes is an online action idle RPG, hero collector, and party builder. Players collect strange, cute, comedic heroes, assemble and improve a crew, and climb an increasingly bizarre shared tower. Success means the collection, progression, party-building, authentication, persistence, and adventure flows remain understandable, reliable, and inviting across supported devices.

## Positioning

Odd Tower combines a shared persistent tower climb with a cast of deliberately odd comedic heroes, making party composition and character personality the center of an accessible web RPG.

## Operating Context

Players enter through Google authentication or a Guest flow, manage heroes and party formation, summon recruits, review progression and resources, enter tower floors or practice runs, and retain progress through the existing persistence system. The product is a Progressive Web App-style experience intended for short mobile sessions as well as wider desktop play.

## Capabilities and Constraints

- Existing React, Vite, and Phaser architecture remains in place.
- Supabase-backed authentication, Google OAuth, Guest progress, persistence, routing, database integration, and gameplay/state contracts must remain intact.
- Existing data and actions must drive the interface; the UI must not present unsupported gameplay as functional.
- No database schema change is required for the redesign unless a separately verified necessity emerges.
- Interfaces must support mobile safe areas, short viewport heights, keyboard navigation, touch targets of at least 44 by 44 pixels, reduced motion, loading and error states, long player names, and large resource values.
- English and Thai content must be supportable without clipped fixed-width layouts.
- Browser broken-image indicators must never be exposed; hero artwork requires stable aspect ratios and themed fallback states.

## Brand Commitments

- Product name: Odd Tower: Odd Heroes.
- Tagline: “Tiny quests. Big weirdos.”
- Personality: cute, strange, comedic, adventurous, energetic, tactile, slightly handmade, welcoming, and full of character.
- Preserve the playful pastel identity while increasing contrast, energy, atmosphere, responsiveness, and game feel.
- Characters and parties are the primary focus; adventure entry is the clearest action; resources and progress support the experience.
- Example hero identities include Grilled Chicken Executioner, Tofu Foam Rabbit, Pink Lizard Chocolate Dip, Robot Jelly, Accountant Octopus, and Samurai Bread.
- Referenced game interfaces are principles-only inspiration; protected characters, artwork, branding, and layouts must not be copied.

## Evidence on Hand

- Existing application routes, authentication and persistence implementations, game state, tests, and hero asset files in this repository.
- Existing hero artwork under `src/assets/fanal/hero/` and asset manifests/resolvers under `src/assets/`.
- No external testimonials, commercial claims, or licensed reference artwork may be fabricated.

## Product Principles

1. Odd Tower is a character-first RPG web game, not a dashboard decorated with game colors.
2. The player should immediately know who is in their party, which adventure is available, and how to begin it.
3. Every interface change preserves player progress and existing functional contracts.
4. Mobile is purpose-built for one-handed play; larger screens use their space deliberately without diluting the focal hierarchy.
5. Progress, locks, rewards, and failure states remain legible, accessible, and honest about the underlying game state.

## Accessibility & Inclusion

Use semantic controls, visible focus states, keyboard-compatible flows, screen-reader labels for critical actions and statuses, color-independent state cues, sufficient contrast, minimum 44-pixel touch targets, reduced-motion support, and localization-resilient layouts for English and Thai.
