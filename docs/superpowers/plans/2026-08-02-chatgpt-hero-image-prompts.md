# ChatGPT Hero Image Prompt Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 48 self-contained ChatGPT image-generation prompt files and one usage README for the six approved Odd Tower heroes.

**Architecture:** Treat each existing hero owner file as the canonical identity source. Generate one master prompt and seven master-linked variant prompts per hero, then validate filenames, counts, image contracts, reference instructions, and prohibited legacy directions.

**Tech Stack:** Markdown prompt files, TypeScript validation/generation helper executed with `tsx`, PowerShell verification.

## Global Constraints

- Output folder is `art-prompts/heroes/prompt/`.
- Exactly 48 image prompt files: six heroes × eight images.
- Every downstream prompt requires the corresponding approved master image attachment.
- Every file is self-contained and directly usable in ChatGPT image generation.
- Gameplay sources are 96 × 96 transparent WebP in order `idle_a`, `idle_b`, `move_left_a`, `move_left_b`.
- Prompts request one isolated image only; never an atlas, contact sheet, or multi-panel image.
- This task generates no images and changes no runtime asset ID or production path.
- Perform no Git operations.

---

### Task 1: Build the prompt-file generator

**Files:**
- Create temporarily: `tools/generate-chatgpt-hero-prompts.ts`
- Read: `art-prompts/heroes/hero_*.md`

- [ ] Extract each hero's definition ID, identity description, silhouette, palette, body/costume/prop, personality, and fixed visual invariants from its canonical owner file.
- [ ] Define the eight exact output contracts and filenames for each hero.
- [ ] Render complete master and master-linked variant Markdown without relying on unstated context.

### Task 2: Generate the prompt library and README

**Files:**
- Create: `art-prompts/heroes/prompt/README.md`
- Create: `art-prompts/heroes/prompt/master_hero_<slug>.md`
- Create: seven variant prompt files per hero under `art-prompts/heroes/prompt/`

- [ ] Generate 48 image prompt files.
- [ ] Generate README instructions covering master approval, reference attachment, generation order, review, and atlas assembly.
- [ ] Inspect representative master, portrait, and gameplay files for direct ChatGPT usability.

### Task 3: Validate and clean up

**Files:**
- Delete temporary generator: `tools/generate-chatgpt-hero-prompts.ts`

- [ ] Verify exactly 48 prompt files plus README and eight files per hero.
- [ ] Verify correct master dependency, output filename, dimensions, WebP, identity lock, negative constraints, and single-image rule in every file.
- [ ] Verify gameplay state names and absence of obsolete down/up/right sources or atlas-generation requests.
- [ ] Remove the temporary generator and repeat the filesystem validation.
