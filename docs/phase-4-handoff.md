# Odd Tower Phase 4 Handoff

## Architecture

- Supabase Auth owns identity; the verified JWT subject owns progression.
- PostgreSQL functions own initialization, Summon RNG/pity, Stars, team invariants, currencies, exactly-once rewards, and trusted-time AFK claims.
- Express exposes typed protected routes with request IDs, stable errors, rate limits, and active-combat mutation restrictions.
- Colyseus loads the saved team and derived stats. Combat reward jobs enter a bounded 4-worker queue; the 20 Hz tick never awaits database I/O.
- React owns the persistent screen stack. Phaser remains lifecycle-scoped to combat. The Local Prototype is preserved.

## Economy and progression

New players receive Gold 500, Gems 300, Upgrade Jelly 0, one database-selected starter, and one active team. Standard Summons cost 100 Gems. Pull 20 guarantees Epic or Legendary. Duplicate Shards are 10/15/30/60; Star costs are 20/50/100/200. Slot 2 unlocks with two unique Heroes; Slot 3 needs three Heroes and 500 Gold.

The Level cap is 20 with cumulative experience derived from `floor(50 * level^1.35)`. Level growth is applied before the 8%-per-Star multiplier.

## Failure behavior

Queue capacity is 200 pending jobs per room, concurrency 4, five attempts, 250 ms initial backoff, 5 s maximum backoff, and 10 s flush timeout. Saturation or exhausted persistence degrades saving and disables Auto Hunt for the affected room path. Retried jobs retain their reward identity.

## Security

No browser bundle receives a secret/service-role key. Browser roles cannot invoke protected RPCs or directly mutate gameplay tables. Error responses do not include raw database messages, tokens, authorization headers, or stack traces.

## Verification

Use the root scripts documented in `README.md`. Database integration tests require the three server Supabase environment variables. `npm run secrets:scan` runs after the production client build.

The complete asset production handoff is
`docs/assets/phase-4-asset-report.md`; its canonical manifests are
`docs/assets/phase-4-asset-manifest.json` and
`docs/assets/phase-4-asset-manifest.csv`.

## Phase 5 boundary

Bosses, portals, multiple floors, PvP, equipment, complex skills, monetization, social systems, and final art are intentionally excluded.
