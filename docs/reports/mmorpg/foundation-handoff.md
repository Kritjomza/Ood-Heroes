# Shard MMO Foundation Handoff

Date: 2026-08-04  
Protocol: 4  
Cloud project: `rmpzfgazjuwkejjgzjka` (`odd-tower-production`)  
Cloud migration record: `20260803200513_mmo_world_foundation`  
Local migration: `20260803200341_mmo_world_foundation.sql`

## Outcome

The isolated MMO foundation is implemented behind server and client feature flags, both disabled by default. The legacy local and room-code multiplayer paths remain registered and available. No Git operation was used, per project direction.

The dedicated Supabase Cloud migration is additive. It provides an RLS-protected world checkpoint, a private lease audit table, and a service-role-only monotonic checkpoint RPC. Cloud verification confirmed authenticated users can read only their own checkpoints and cannot mutate checkpoints or read lease audit records. Stale revisions are rejected transactionally.

## Reproducible evidence

- `npm run test:mmo:foundation`: 10 files, 45 tests passed.
- `npm run test:load:mmo:foundation`: passed.
- `npm run build`: server and client production builds passed.
- Targeted ESLint over the MMO and touched application files: passed.
- Protocol, server, and client TypeScript project checks: passed.
- Supabase transactional cloud verification: passed and rolled back without retaining fixture data.

Load diagnostic result:

```json
{"admitted":30,"rejected":1,"duplicateLeaseCount":0,"reconnectSuccessRate":1,"p95CommandAckMs":0,"p99CommandAckMs":0.001,"maxPopulation":30}
```

This is an in-process deterministic admission/lease diagnostic, not an internet latency benchmark. Production load approval still requires a staged network soak against deployed channel workers.

## Foundation gates

| Gate | Result |
| --- | --- |
| Deterministic combat facade | Pass |
| Strict protocol-v4 parsing | Pass |
| 30-account channel capacity | Pass |
| One active lease per account | Pass |
| Reconnect lease reuse | Pass |
| Cloud checkpoint RLS and monotonic writes | Pass |
| Feature flag and account allowlist | Pass |
| Legacy room remains registered | Pass |
| React/Phaser production build | Pass |
| Mobile safe-area and accessible status component tests | Pass |
| Deployed multi-device browser matrix | Required before rollout |
| Five-minute staged network soak | Required before rollout |

## Rollout and rollback

1. Keep `MMO_WORLD_ENABLED=0` and `VITE_MMO_WORLD_ENABLED=0` by default.
2. Add only internal Supabase user IDs to `MMO_WORLD_ACCOUNT_IDS`.
3. Enable the server flag first and verify readiness, then deploy the client flag.
4. Roll back entry immediately by disabling the client flag, followed by the server flag. The additive database objects may remain; legacy play is independent of them.

## Known operational findings

- The production client bundle reports a pre-existing large-chunk warning; Phaser is dynamically split for the MMO shell, but the primary application bundle still exceeds Vite's 500 kB advisory threshold.
- Full-repository lint is polluted by pre-existing vendored `.agents/skills/impeccable` errors; targeted lint of all touched runtime files passes.
- Supabase reports leaked-password protection disabled. Enable it before broad public authentication rollout: <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>.
- Supabase also reports the unrelated existing `private.mutation_results` table without RLS. It was not changed because it predates and is outside this migration; it should receive a separate security review.
- The `private.mmo_lease_audit` table intentionally has RLS enabled with no client policies and no authenticated grants; server service-role access is the only supported path.
