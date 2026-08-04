# MMO staged rollout and rollback

The legacy `floor_1` room and room-code flow remain available throughout rollout. The MMO world is additive and enters service when `MMO_WORLD_ENABLED=1`. Normal rollout is open to every authenticated account; `MMO_WORLD_ALLOW_ALL=0` is an optional emergency cohort fallback.

## Go gates

- Focused and full TypeScript builds pass.
- Focused MMO tests pass, including protocol forgery, replay, party conflict, instance recovery, reward idempotency, and boss contribution tests.
- 30-player/90-hero channel soak: tick p95 ≤ 25 ms and p99 ≤ 40 ms.
- Movement acknowledgement p95 ≤ 150 ms; reconnect success ≥ 99.5%.
- Population never exceeds 30; party size never exceeds four; duplicate committed reward identities = 0.
- Cloud migration list is identical locally and remotely; RLS is enabled on every MMO table.
- Mobile checks at 390×844, 412×915, and 740×360 show no horizontal overflow, clipped controls, or blocked 44 px targets.

## Stages

1. **Internal:** set `MMO_WORLD_ROLLOUT_STAGE=internal`, use `MMO_WORLD_ALLOW_ALL=0` only if a temporary cohort is required, and observe tick debt, channel crashes, transfer failures, persistence backlog, pending reward age, and progression anomalies for one full scheduled boss cycle.
2. **Open alpha:** set `MMO_WORLD_ALLOW_ALL=1` so every authenticated account can enter.
3. **Open beta:** keep the world open after rollback rehearsal and a clean recovery drill.

## Rollback rehearsal

1. Set `MMO_WORLD_ENABLED=0` (or set `MMO_WORLD_ALLOW_ALL=0` and provide a temporary cohort if only partial rollback is needed).
2. Restart only the new MMO server workers; leave the legacy server and Supabase tables running.
3. Confirm legacy `floor_1` entry succeeds and no new MMO leases are assigned.
4. Keep pending rewards visible in the cloud ledger; do not spend or replay them until the MMO service is restored and commitment is confirmed.
5. Re-enable the feature flag only after the incident cause, recovery checkpoint, and duplicate-reward checks are recorded.

The rollback target is under five minutes because it is configuration-only and does not require destructive schema changes.
