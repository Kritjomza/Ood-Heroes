# Shard MMORPG Rollout Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved shard-oriented MMORPG as independently verifiable vertical slices while the legacy game remains available.

**Architecture:** A new World Directory assigns authenticated players to channel simulations hosted by Zone Shards; Private Instance Workers reuse a deterministic combat kernel; Supabase/Postgres persists only transactionally confirmed progression and checkpoints. The new runtime, protocols, database objects, and client routes are additive and feature-flagged.

**Tech Stack:** TypeScript 5.9, Node.js 24, Colyseus 0.17, Phaser 3.90, React 19, Supabase/Postgres, Vitest 3, Playwright 1.55

## Global Constraints

- Preserve the legacy game until a separately approved retirement plan.
- Public channel target: 10–30 connected players; hard admission cap: 30.
- Standard party limit: four players and 12 deployed heroes.
- Server-authoritative controls: Leader movement, target preference, Auto Hunt, contextual interaction.
- Automatic basic attacks and skills remain enabled during manual movement.
- Protocols are explicitly versioned; database migrations are additive.
- Pending rewards are visible but unusable until committed.
- Public free-text chat is excluded from initial release.
- Mobile touch targets are at least 44 CSS px and all critical UI respects safe areas.

---

## Phase Plans

1. **Foundation vertical slice** — deterministic kernel boundary, protocol v4 envelope, World Directory, one feature-flagged channel, safe checkpoint schema, automatic entry, and recovery UI. Detailed in `docs/superpowers/plans/2026-08-04-shard-mmorpg-foundation.md`.
2. **Three-hero simulation** — Leader movement, companion formation AI, role-priority automatic combat, Auto Hunt state machine, sanctuary defeat, weakness, and Quick Return.
3. **Ecology and monster AI** — habitat profiles, seeded population director, bounded movement states, spatial scheduling, leashing, respawn safety, and recovery invariants.
4. **Dual progression and reward ledger** — Adventure Rank, Hero Level caps, full deployed XP, reserve XP, catch-up, XP items, signed encounter results, pending rewards, and duplicate prevention.
5. **Activities and bosses** — shared event credit, scheduled channel-local world bosses, activity-triggered zone bosses, contribution tiers, daily premium eligibility, announcements, and effect budgets.
6. **Parties, friends, and channel affinity** — persistent four-player parties, consented friend following, presence privacy, coordinated transfers, blocking, presets, and room-code private play.
7. **Private instances** — 1–4-player story and dungeon workers, ready checks, matchmaking, instance checkpoints, selected revive-token rules, completion, and recovery.
8. **Complete mobile shell** — responsive HUD, minimap, hero strip, Adventure dock, sheets, accessibility, orientation behavior, background/resume, and poor-network states.
9. **Production hardening and cohort rollout** — adversarial suites, multi-channel soak, dashboards, rollback rehearsal, invited alpha, opt-in beta, cohort expansion, and default-new-world gate.

Each phase receives its own detailed plan before implementation. A phase cannot begin production rollout until its dependencies have passed their local gates, but later feature development may continue behind disabled flags.

## Concrete Go/No-Go Metrics

These are initial acceptance thresholds. Implementation may tighten them but may not weaken them without updating and reapproving the design.

### Correctness and Security

- Duplicate committed reward transactions: exactly `0` across automated replay, transfer, retry, and 24-hour soak suites.
- Simultaneous authoritative channel memberships per account: exactly `1`.
- Invalid inventory, negative currency, XP above cap, HP outside `[0, maxHp]`, or population above hard limit: exactly `0` invariant failures.
- Accepted forged, stale-revision, unauthorized-party, or over-rate command cases: exactly `0`.
- Unresolved critical or high-severity defects at a rollout gate: exactly `0`.

### Server Simulation

- Simulation frequency: `20 Hz`.
- At 30 players, 90 deployed heroes, 80 standard monsters, and one world boss: p95 tick duration `<= 25 ms`, p99 `<= 40 ms`, maximum sustained tick debt `<= 200 ms`, and completed ticks `>= 99.9%` during a 60-minute soak.
- Expensive AI decisions: `<= 5 Hz` per monster; idle wander decisions: `<= 1 Hz`.
- Process memory growth after warm-up: `<= 10%` across the final 45 minutes of a 60-minute fixed-population soak.
- Unbounded event, contribution, path, transfer, or reward collections: exactly `0` detected by metrics assertions.

### Network and Recovery

- Same-region movement command acknowledgement: p95 `<= 150 ms`, p99 `<= 250 ms` in the controlled load environment.
- Snapshot payload: p95 `<= 64 KiB` and p99 `<= 96 KiB` per client update.
- Successful safe channel transfers: `>= 99.9%` over 10,000 fault-injected attempts.
- Failed transfers resulting in duplicate membership or reward: exactly `0`.
- Valid reconnect within the reservation window: `>= 99.5%` over 2,000 fault-injected attempts.
- Recovery to source lease or sanctuary after injected channel failure: p95 `<= 10 s`, p99 `<= 20 s`.

### Persistence

- Durable mutation commit latency: p95 `<= 500 ms`, p99 `<= 1.5 s` under expected write load.
- Pending reward age under healthy database conditions: p95 `<= 2 s`, p99 `<= 10 s`.
- Pending rewards spendable before commit: exactly `0` test cases.
- Checkpoint recovery data loss: no committed progression loss; position rollback `<= 30 s` outside explicit checkpoints.

### Mobile Client

- Named baseline devices for browser testing: iPhone 12 viewport `390x844`, Pixel 7 viewport `412x915`, and short landscape `740x360`.
- Gameplay frame rate on representative mid-range physical Android hardware: p95 frame time `<= 33.3 ms` during ordinary play and `<= 50 ms` during a 30-player boss after effect degradation.
- Long tasks over 100 ms during a five-minute boss test: `<= 2` after initial load.
- Initial authenticated world shell interactive on Fast 4G emulation: p75 `<= 5 s` with cached static assets.
- Critical control overlap, safe-area clipping, inaccessible primary action, or touch target below 44 CSS px: exactly `0` across required viewports.
- Automated accessibility: `0` serious or critical axe violations on entry, gameplay HUD, party sheet, pending rewards, and transfer recovery surfaces.

### Product and Operations

- Party split caused by automatic assignment: exactly `0`.
- World-boss premium reward grants above daily eligibility: exactly `0`.
- Feature-flag rollback from new-world entry to legacy entry: `<= 5 min` operational execution time in rehearsal.
- Alerting covers tick debt, channel crash, transfer failure, persistence backlog, oldest pending reward, duplicate rejection, and progression anomaly before invited alpha.

## Rollout Gate Evidence

Every gate records the exact commit, protocol version, migration version, test commands, soak configuration, metric export, known-defect list, and rollback result. Evidence is stored under `docs/reports/mmorpg/` and linked from the corresponding phase handoff.

