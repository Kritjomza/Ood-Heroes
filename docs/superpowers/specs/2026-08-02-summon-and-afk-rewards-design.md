# Summon Reliability and AFK Reward Design

Date: 2026-08-02

## Objective

Repair and harden Odd Tower's summon flow, replace the existing AFK economy with a capped three-tier reward schedule, and make summoning feel like a major character-collection moment without compromising accessibility or transaction safety.

## Scope

This change covers shared economy rules, network contracts, Supabase transactions and grants, game-server persistence boundaries, the persistent React shell, the summon screen and reveal presentation, the AFK reward modal, and automated tests. It preserves the existing React/Vite, Node server, and Supabase architecture.

It does not add multi-pulls, new heroes, new banners, paid purchases, or a generalized economy framework.

## AFK Reward Rules

AFK elapsed time is calculated from trusted database timestamps. Client clocks and client-provided reward values are never used.

| Trusted elapsed time | Rewarded duration | Gold | Diamonds (`gem`) | Hero shards |
| --- | ---: | ---: | ---: | ---: |
| Less than 10 minutes | 0 minutes | 0 | 0 | 0 |
| 10:00–19:59 | 10 minutes | 80 | 10 | 3 |
| 20:00–29:59 | 20 minutes | 160 | 20 | 6 |
| 30:00 or more | 30 minutes | 250 | 35 | 10 |

The maximum accumulated AFK duration is 30 minutes. Once a claim is prepared, the settlement cursor advances through the entire observed elapsed period, not merely the rewarded tier. This prevents repeatedly converting time beyond the cap into additional claims.

Hero shards are granted to each hero currently in the player's active party. The claim payload records the affected hero IDs and exact per-hero shard amount so the result is auditable and replay-safe. If the active party is unexpectedly empty, preparation fails safely instead of silently discarding shards.

Only one pending claim may exist per player. Preparing a claim below 10 minutes returns no claim. Claiming uses the existing idempotency key and reward-ledger identity so retries return the prior result without applying currency or shards twice.

## Summon Transaction Design

The authenticated server supplies the user ID to the persistence layer. The client may supply only the banner ID and an idempotency key.

The database transaction performs these steps atomically:

1. Return the stored result for an already-used user/key pair.
2. Validate that the banner exists, is enabled, is within its active dates, and has a usable positive-weight pool.
3. Lock and validate the player's Gem balance.
4. Create or lock the player's banner pity row.
5. Select from the complete pool, or the epic/legendary subset when the pity threshold is reached.
6. Deduct Gems exactly once.
7. Insert the new hero or apply the configured duplicate shard award.
8. Update pity and total-pull counters.
9. Record summon history and return a stable typed response.

The response includes outcome type, summoned hero definition ID and display data, rarity, awarded duplicate shards, Gem cost, updated Gem balance, pity before/after, and whether the result was replayed. The client validates this response before presenting it.

Invalid or empty pools fail before currency is deducted. Concurrent calls are serialized by row locks. A reused idempotency key cannot charge twice, and ownership is always derived from the verified authentication identity.

## Client Flow and Animation

The summon screen uses an explicit state machine:

- `idle`: banner, affordability, and pity are visible.
- `requesting`: the request is in flight; the control is disabled and the shrine begins charging.
- `revealing`: a successful typed response drives the visual sequence.
- `revealed`: hero name, rarity, new/duplicate status, shard reward, updated pity, and a continue/summon-again action are visible.
- `error`: the shrine returns to rest and the player can retry without navigating away.

The primary motion sequence lasts about 1.8–2.4 seconds: rune activation, capsule lift and anticipation, a brief rarity-colored burst, silhouette reveal, then a spring-settled hero card. Particles, a short visual-stage shake, layered glow, and card overshoot scale with rarity. Motion affects visual wrappers only and never gameplay state or layout geometry.

The sequence is skippable by activating the reveal surface. With `prefers-reduced-motion`, it becomes a short crossfade with no shake, flashing burst, or large movement. Status text is exposed through a polite live region, focus moves to the revealed result heading, and all controls retain keyboard operation and 44-pixel minimum targets.

The implementation reuses the existing hero asset resolver and themed fallbacks. No new external art is required.

## AFK Presentation

The modal reports the rewarded duration and the exact three requested rewards: Gold, Diamonds, and Shards. It no longer mentions half-hour intervals, Upgrade Jelly, or EXP. It indicates the 30-minute cap when reached and retains a clear collect action plus the existing option to leave the parcel pending.

The reward reveal uses a restrained chest pop and sequential reward entry. Reduced-motion mode removes the pop and stagger. Values come only from the validated server preview.

## Contract and Persistence Changes

The shared protocol replaces interval-oriented AFK fields with `rewardedMinutes`, `gold`, `diamonds`, `shardsPerActiveHero`, and `recipientHeroIds`. The summon result receives a concrete shared type and runtime validator.

A new forward-only Supabase migration replaces the affected functions and updates grants as needed. Existing migration files remain immutable. Database-generated TypeScript types are regenerated after the local schema is reset.

Existing pending claims created under the old reward model are invalidated during migration and their settlement cursors are reset to migration time. This avoids claiming obsolete EXP/Jelly payloads or receiving a retroactive windfall after the rule change.

## Error Handling

- Domain errors remain mapped to safe player-facing messages.
- Malformed persistence responses are rejected at the server/client contract boundary.
- A failed summon returns the animation to an actionable state and never displays an invented hero.
- A failed AFK collection keeps the pending parcel available for retry.
- Database exceptions roll back every balance, hero, history, pity, and ledger mutation together.

## Security Requirements

- No service-role or secret credential is shipped to the browser.
- Public transaction functions remain callable only by the server role.
- Every transaction verifies player ownership using the server-supplied authenticated user ID.
- Security-definer functions use an explicit safe search path and have `PUBLIC`, `anon`, and `authenticated` execution revoked.
- Idempotency is scoped by user and operation, and all unique constraints remain the final concurrency guard.
- AFK durations, banner costs, rarity pools, rewards, duplicate shards, and pity are database-owned values.
- Cross-user claim IDs and hero IDs are rejected.

## Testing and Acceptance Criteria

Tests are written first and observed failing before each production change.

Shared rule tests cover boundaries immediately below and at 10, 20, and 30 minutes; durations beyond 30 minutes; invalid timestamps; and literal reward values.

Database tests prove:

- no AFK claim below 10 minutes;
- exact rewards at all three tiers;
- durations above 30 minutes never exceed the cap;
- the full observed duration is settled;
- each active hero receives the correct shard amount exactly once;
- replayed claims and summons do not duplicate rewards or deductions;
- cross-user claims fail;
- malformed/empty summon pools fail without charging;
- pity selection and reset work at the threshold;
- concurrent or replayed summon requests record one result per key.

Protocol, server, and React tests prove the new payloads are validated, errors remain retryable, the revealed hero details are rendered, controls are disabled only while appropriate, and reduced-motion behavior remains available.

The final verification run includes focused unit tests, database tests, security checks, lint, typecheck, production build, and one bounded desktop/mobile browser inspection of summon and AFK surfaces.

## Rollout

Apply the migration in development, regenerate database types, run the full verification set, and deploy server and client alongside the migration. Monitor transaction error codes and persistence health after deployment. No feature flag is required because old pending claims are deliberately invalidated and both updated clients and servers consume the new contract together.
