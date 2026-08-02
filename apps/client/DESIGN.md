---
name: "Odd Tower: Odd Heroes"
description: "A tactile, character-first hero lobby built from cream paper, cocoa outlines, tower stone, and saturated adventure accents."
colors:
  cream-canvas: "#fff8e8"
  paper: "#fffdf7"
  gate-paper: "#fff9e9"
  plastic-light: "#fffef9"
  board-surface: "#f7eed8"
  cocoa-outline: "#4d332d"
  warm-ink: "#3b3434"
  muted-ink: "#75635c"
  tower-stone: "#d8c3a4"
  adventure-gold: "#ffc943"
  coral-ribbon: "#ef765f"
  mint-action: "#83d8bc"
  sky-stage: "#91d8ee"
  rarity-purple: "#9a75d8"
  focus-blue: "#315f9f"
  danger-red: "#a33c48"
  heroes-purple: "#b67fe8"
  summon-violet: "#7654cf"
  team-mint: "#68c9ad"
  account-coral: "#f18478"
typography:
  display:
    fontFamily: "ui-rounded, Arial Rounded MT Bold, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(34px, 8vw, 62px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  hero-display:
    fontFamily: "ui-rounded, Arial Rounded MT Bold, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(64px, 8vw, 116px)"
    fontWeight: 900
    lineHeight: 0.78
    letterSpacing: "-0.035em"
  title:
    fontFamily: "ui-rounded, Arial Rounded MT Bold, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-rounded, Arial Rounded MT Bold, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  label:
    fontFamily: "ui-rounded, Arial Rounded MT Bold, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  tape: "3px"
  badge: "8px"
  sticker: "11px"
  control: "14px"
  card: "16px"
  panel: "18px"
  stage: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-enter-floor:
    backgroundColor: "{colors.adventure-gold}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "118px"
  button-practice:
    backgroundColor: "{colors.mint-action}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "62px"
  input-hero-name:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "50px"
  card-mission:
    backgroundColor: "{colors.gate-paper}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.stage}"
    padding: "18px"
  nav-shell:
    backgroundColor: "{colors.plastic-light}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.stage}"
    padding: "4px"
    height: "68px"
  nav-home-active:
    backgroundColor: "{colors.adventure-gold}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.card}"
    height: "58px"
---

# Design System: Odd Tower: Odd Heroes

## Overview

**Creative North Star: "The Handmade Hero Gate"**

Odd Tower is a character-first adventure lobby, not a centered dashboard grid. The interface should feel like a cheerful game board assembled from cream paper, carved tower stone, painted ribbons, toy-like plastic controls, and thick cocoa ink. Characters occupy the visual stage; resources and progress form a compact supporting HUD; the next adventure is the unmistakable action.

The world is cute, strange, energetic, and slightly handmade. Small rotations, inset highlights, irregular silhouettes, illustrated fallbacks, and soft offset depth make controls feel physical without sacrificing legibility. Saturated rarity colors punctuate a warm neutral base, while every state remains data-honest, keyboard-visible, touch-friendly, localization-resilient, and useful at narrow or short viewports.

**Key Characteristics:**

- Character artwork and party formation dominate the first view.
- Cream paper and tower stone are bounded by thick cocoa outlines.
- Gold, coral, mint, sky, and purple communicate action and game roles.
- Inset highlights and downward shadows make controls feel pressable.
- Small rotations and ribbon silhouettes supply handmade personality.
- Responsive navigation moves from a bottom dock to a left rail without changing hierarchy.

## Colors

The palette pairs warm paper neutrals with a dark cocoa drawing line and a small set of saturated, confectionery adventure colors.

### Primary

- **Adventure Gold:** The clearest action color, reserved for entering a floor, home-state emphasis, player emblems, and compact progress tickets.
- **Cocoa Outline:** The structural drawing line around stages, plaques, controls, avatars, and illustrations; it creates contrast and binds the world together.

### Secondary

- **Coral Ribbon:** Labels, flags, guest actions, and urgent but friendly emphasis.
- **Mint Action:** Practice and secondary-positive actions, party/team identity, and restorative accents.
- **Sky Stage:** Open-air stage fields, tower windows, and atmospheric radial light.
- **Rarity Purple:** Mission signage, reward fields, summon identity, and rare-content emphasis.

### Neutral

- **Cream Canvas:** The soft global base behind auth and paper-built scenes.
- **Paper / Gate Paper:** Primary reading surfaces, cards, labels, currency capsules, and modal sheets.
- **Board Surface:** The warmer stone-paper ground beneath the persistent adventure shell.
- **Tower Stone:** Architecture and grounded stage scenery.
- **Warm Ink:** Primary text; **Muted Ink** supports descriptions, labels, and resource metadata.
- **Focus Blue:** A deliberately non-decorative keyboard focus color that remains visible across the warm palette.

### Named Rules

**The Cocoa Line Rule.** Major interactive or narrative objects use a dark cocoa boundary; do not replace that structure with faint gray hairlines.

**The Gold Means Go Rule.** Adventure Gold belongs to the primary route and active home state. Keep it rare enough that “Enter Floor” remains unmistakable.

**The Color-Plus-Shape Rule.** Never communicate active, locked, failed, or rare states by hue alone; pair color with labels, borders, icons, or position.

## Typography

**Display Font:** ui-rounded with Arial Rounded MT Bold, Noto Sans Thai, system-ui, and sans-serif fallbacks  
**Body Font:** ui-rounded with Arial Rounded MT Bold, Noto Sans Thai, system-ui, and sans-serif fallbacks

**Character:** A single rounded family keeps the UI toy-like and friendly. Hierarchy comes from scale, dense weights, compact leading, and labels rather than from introducing an unrelated editorial face.

### Hierarchy

- **Hero Display** (900, oversized responsive display, 0.78 line-height): Auth identity and rare brand-scale moments only.
- **Display** (900, responsive page display, 1 line-height): Screen greetings and major adventure headings; allow wrapping for long player names.
- **Title** (900, large compact title, 1.08 line-height): Mission signs, card headings, and primary action text.
- **Body** (700, standard reading size, 1.5 line-height): Explanations and supportive copy, generally constrained to about 34–38 characters on promotional/auth surfaces.
- **Label** (900, compact label): Tabs, badges, stats, ribbons, and metadata; uppercase is reserved for short sign-like labels.

### Named Rules

**The Rounded Voice Rule.** All persistent-shell text uses the rounded stack, including Thai fallback; do not introduce a generic geometric sans inside the game lobby.

**The Sign, Not Spreadsheet Rule.** Compact labels should read like painted plaques—short, bold, and contextual—not like dense dashboard column headers.

## Layout

The persistent shell is mobile-first and safe-area aware. A fixed player strip occupies the top, the main adventure content scrolls independently, and the primary navigation is a five-item bottom dock on compact screens. At tablet and desktop widths the dock becomes a left rail; from 1180px it settles at 104px wide while content can expand to 1480px.

The Hero Gate lobby uses an asymmetric two-column board: the character stage receives roughly two-thirds of the width and the mission gate the remainder. At 900px and below the layout becomes a single column, with the mission panel overlapping the stage by 28px to preserve the gate-to-briefing story. The spacing rhythm is built from 4, 8, 12, 16, 20, 24, and 32px increments.

Compact layouts preserve one-handed reach and 44px minimum targets. At 620px, resource capsules tighten, a low-priority third resource may hide, the stage compresses, and progress remains a three-column strip; below 350px, mission stats and progress become single-column. Short desktop viewports also reduce vertical stage height. Copy must wrap or truncate intentionally for English, Thai, long player names, and large resource values.

## Elevation & Depth

The system uses a hybrid of bold outlines, inset highlights, and soft downward shadows. Thick borders define object identity; an inset white highlight suggests glossy painted plastic; offset brown shadows make large stages and buttons feel physically stacked above the board. Backdrop darkness is reserved for modal focus.

### Shadow Vocabulary

- **Game Depth** (`0 9px 0 rgb(77 51 45 / 22%), 0 18px 36px rgb(77 51 45 / 18%)`): Large gates, album stickers, and primary feature surfaces.
- **Game Inset** (`inset 0 3px 0 rgb(255 255 255 / 65%)`): Painted highlights on plaques, currency capsules, and controls.
- **Soft Card Lift** (`0 18px 45px rgb(83 55 43 / 20%)`): Auth card and isolated paper sheets.
- **Modal Lift** (`0 28px 70px rgb(20 14 15 / 45%)`): Dialogs over the darkened game world.

### Named Rules

**The Stacked Toy Rule.** Large objects combine outline, inset shine, and downward depth; never use a generic floating gray shadow as the only separator.

**The Pressed State Rule.** On activation, controls move down and their shadow shortens, preserving the physical model.

## Shapes

Controls use generous 14px corners, cards sit around 16–18px, and major stages use 20px corners. Ribbons, badges, tickets, tape, circular pips, and arched empty-party silhouettes prevent the system from becoming a field of identical rounded rectangles. Small deliberate rotations of roughly one to three degrees create handmade energy; they remain accents, not a readability tax.

Hero artwork retains stable, clipped aspect ratios. When art fails, the fallback is an illustrated, cocoa-outlined face on rarity color—not a browser broken-image indicator.

**The Silhouette Mix Rule.** Pair grounded rounded panels with at least one relevant sign, ribbon, arch, sticker, or illustrated shape in focal game compositions.

## Components

### Buttons

- **Shape:** Chunky, tactile controls with gently rounded corners (14px), dense weight, and at least 48px height.
- **Primary:** Adventure Gold with Warm Ink, pronounced inset shine, and downward cocoa shadow. The lobby’s Enter Floor control grows to 118px and uses title-scale copy.
- **Hover / Focus:** Hover lifts by about 2px where pointer input applies. Focus uses a 4px Focus Blue outline with 3px offset. Active controls move down 2px and shorten their shadow.
- **Secondary:** Mint fills indicate practice or secondary-positive paths. Paper buttons support neutral and provider actions; Coral supports energetic guest or summon actions.
- **Disabled:** Remove lift, suppress shadow, and preserve readable text; state must not rely on opacity alone.

### Chips

- **Style:** Resource capsules and stat chips use paper or warm stone fills, 2px cocoa borders, 8–12px corners, tabular numerals, and compact bold labels.
- **State:** Filter chips stay horizontally scrollable on mobile; selected state adds explicit fill and boundary rather than hue alone.

### Cards / Containers

- **Corner Style:** 16–20px for reading cards, mission gates, stages, and modals.
- **Background:** Paper for reading; sky, stone, purple, or system color for authored game roles.
- **Shadow Strategy:** Feature surfaces use Stacked Toy depth; small informational cards use inset shine or a short soft lift.
- **Border:** 3–4px cocoa on focal game objects; 5px on the mission modal.
- **Internal Padding:** Usually 12–24px; responsive feature cards may use a 22–42px clamp.

### Inputs / Fields

- **Style:** Paper fill, 2px cocoa-tinted stroke, 14px corners, 50px minimum height, and 13px horizontal padding.
- **Focus:** Full cocoa border plus a 4px translucent Focus Blue ring with 2px offset.
- **Error / Disabled:** Errors sit in a softly tinted danger panel with explicit text. Disabled actions remain legible and non-interactive.

### Navigation

The five adventure destinations use icon-over-label tabs in a glossy paper dock. The current destination rises from the dock and receives its system color; the Summon tab switches to light text on violet. Focus is always outlined. On screens 769px and wider the dock becomes a vertical left rail and the active tab shifts right instead of upward.

### Hero Gate

The signature lobby component combines a large illustrated party stage, an arched tower opening, visible party-slot labels, empty-slot affordances, an overlapping mission sign, mission stats, and a dominant Enter Floor action. Preserve the order: meet the crew, read the next challenge, then enter. Supporting progress shortcuts sit below and never compete with the route.

### Mission Briefing

Mission details open as a paper sheet over a 72% dark warm backdrop. The dialog uses a 5px outline, a gold 48px close button, readable rewards, and a two-action footer. On compact screens rewards collapse to one column. Opening focuses the enter action; Escape and backdrop interaction close the dialog.

## Do's and Don'ts

### Do:

- **Do** keep characters and party formation larger than resource and progress summaries.
- **Do** preserve the cocoa outline, inset shine, and soft offset-depth combination on focal game objects.
- **Do** reserve Adventure Gold for the clearest next action and the active home route.
- **Do** use stable hero-art boxes with themed illustrated fallback states.
- **Do** maintain safe-area padding, visible keyboard focus, reduced-motion behavior, and at least 44px touch targets.
- **Do** let English, Thai, long names, and large values wrap, truncate, or reflow intentionally.

### Don't:

- **Don't** turn the lobby into a centered analytics dashboard or a uniform card grid.
- **Don't** flatten the world into borderless pastel rectangles or faint gray dividers.
- **Don't** let secondary progress, shop-like actions, or resources compete with Enter Floor.
- **Don't** use hue as the only signal for active, error, rarity, or lock state.
- **Don't** expose broken-image chrome, clipped fixed-width labels, hidden focus, or motion that ignores reduced-motion preferences.
- **Don't** copy protected characters, artwork, branding, or layouts from reference games.
