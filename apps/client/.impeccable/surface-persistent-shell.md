# Persistent game shell

- Mode: Operate.
- Audience/job: mobile-first hero collectors reviewing their crew, progression, and next tower action.
- Primary action: enter the available tower floor with the active party.
- Constraints: preserve auth, Guest persistence, OAuth, mutations, gameplay contracts, safe areas, keyboard access, and reduced motion.
- Approved comp: `.impeccable/mocks/lobby-a-hero-gate.png` (Hero Gate A).
- Memorable moment: the active hero stands at the tower gate above a tactile Floor 01 briefing and oversized gold entry action.

## Fidelity inventory

| Ingredient                  | Implementation medium                                  |
| --------------------------- | ------------------------------------------------------ |
| Player/resource HUD         | semantic React + CSS + existing SVG icons              |
| Active hero and party slots | bundled PNG heroes + semantic buttons/CSS frames       |
| Tower gate atmosphere       | CSS stone/paper surfaces and geometric decoration      |
| Floor mission briefing      | semantic dialog and existing game data/actions         |
| Enter Floor action          | semantic button with tactile CSS states                |
| Navigation dock             | existing SVG icons + responsive desktop/mobile CSS     |
| Loading/error/fallback      | existing state components plus resilient hero fallback |
