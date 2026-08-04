# MMORPG Completion Implementation Plan

> **For agentic workers:** Use this plan task-by-task with focused tests and verification gates. Git operations are intentionally excluded by project instruction.

**Goal:** Finish the remaining integration, persistence, gameplay, mobile, and production-readiness work for the shard-oriented MMORPG while keeping the legacy game available.

**Architecture:** Extend the existing feature-flagged Colyseus MMO runtime, deterministic game-core rules, React/Phaser client, and Supabase Cloud persistence. Keep pure services testable in isolation, then wire them into authenticated rooms and transactional repositories. Do not replace or remove the legacy room until all release gates pass.

**Tech Stack:** TypeScript 5.9, Node.js, Colyseus 0.17, Phaser 3.90, React 19, Supabase/Postgres, Vitest, Playwright.

## Global Constraints

- MMO world entry remains disabled unless `MMO_WORLD_ENABLED=1` and the account is allowlisted.
- Public channels admit 10–30 connected players with a hard cap of 30.
- Parties contain at most four players; each player deploys three heroes.
- Movement, target preference, Auto Hunt, and contextual interaction are the only primary controls.
- Automatic basic attacks and role skills remain enabled during manual movement.
- All mutations are server-authoritative and idempotent.
- Pending rewards remain visible but unusable until persistence confirms commitment.
- Public free-text chat remains out of the initial release.
- Legacy `floor_1` and room-code play remain available through the rollout.
- No Git commands or commits are part of execution.

---

### Task 1: Durable progression and reward persistence

**Files:**
- Create: `supabase/migrations/20260804190000_mmo_progression_rewards.sql`
- Create: `supabase/tests/mmo_progression_rewards.sql`
- Create: `apps/game-server/src/mmo/persistence/ProgressionRepository.ts`
- Create: `apps/game-server/src/mmo/persistence/RewardRepository.ts`
- Modify: `packages/network-protocol/src/database.types.ts`
- Test: `apps/game-server/tests/mmo/progressionRepository.test.ts`
- Test: `apps/game-server/tests/mmo/rewardRepository.test.ts`

**Interfaces:**
- `ProgressionRepository.load(accountId): Promise<AccountProgression>`
- `ProgressionRepository.saveIfNewer(accountId, progression, revision): Promise<'saved' | 'stale'>`
- `RewardRepository.prepare(input): Promise<PendingReward>`
- `RewardRepository.commit(rewardIdentity): Promise<CommittedReward>`
- `RewardRepository.get(rewardIdentity): Promise<PendingReward | CommittedReward | null>`

- [ ] Write SQL tests for account ownership, monotonic revisions, duplicate reward identity, pending visibility, and unusable-until-commit behavior.
- [ ] Add additive tables for account Adventure Rank, hero progression, reward records, and progression revisions with RLS and service-role mutation functions.
- [ ] Implement repositories through the existing Supabase service-role seam; never trust client-supplied progression.
- [ ] Replace in-memory progression/reward writes in MMO rooms with transactional repository calls and retry-safe identities.
- [ ] Verify cloud SQL tests, repository tests, replay tests, and existing persistence tests.

### Task 2: Complete shared boss lifecycle and activity integration

**Files:**
- Modify: `apps/game-server/src/mmo/channels/MmoZoneRoom.ts`
- Modify: `apps/game-server/src/mmo/ecology/EcologyDirector.ts`
- Modify: `apps/game-server/src/mmo/activities/BossActivityService.ts`
- Create: `apps/game-server/src/mmo/activities/BossScheduleService.ts`
- Modify: `apps/game-server/src/mmo/channels/MmoZoneState.ts`
- Test: `apps/game-server/tests/mmo/bossScheduleService.test.ts`
- Test: `apps/game-server/tests/mmo/bossRoomIntegration.test.ts`

**Interfaces:**
- `BossScheduleService.nextEvent(zoneId, nowMs): ScheduledBossEvent | null`
- `BossScheduleService.countdown(eventId, nowMs): number`
- `BossActivityService.recordContribution(...)`
- `BossActivityService.finish(...)`

- [ ] Add published UTC schedule data with deterministic event IDs and countdown state.
- [ ] Spawn scheduled bosses independently in every eligible channel.
- [ ] Connect dynamic ecology bosses to the same contribution ledger without allowing duplicate event IDs.
- [ ] Publish announcement, countdown, active boss, contribution, and completion state to clients.
- [ ] Persist premium reward eligibility transactionally and enforce one best premium reward per account per day.
- [ ] Verify channel isolation, contribution ordering, reward replay, daily limits, and event recovery after room restart.

### Task 3: Wire persistent parties, friends, and safe channel transfers

**Files:**
- Create: `apps/game-server/src/mmo/social/PartyService.ts`
- Create: `apps/game-server/src/mmo/social/FriendService.ts`
- Modify: `apps/game-server/src/mmo/directory/WorldDirectory.ts`
- Modify: `packages/network-protocol/src/mmo/envelope.ts`
- Modify: `packages/network-protocol/src/mmo/validation.ts`
- Modify: `apps/client/src/mmo/MmoWorldClient.ts`
- Test: `apps/game-server/tests/mmo/partyService.test.ts`
- Test: `apps/game-server/tests/mmo/friendService.test.ts`
- Test: `apps/game-server/tests/mmo/channelTransfer.test.ts`

**Interfaces:**
- `PartyService.create/invite/accept/leave/disband`
- `FriendService.request/accept/revoke/canFollow`
- `WorldDirectory.assign({ partyAccountIds, friendChannelId })`
- Protocol-v4 optional party and friend affinity fields with strict bounds.

- [ ] Persist party membership and mutual friend consent through server-owned mutations.
- [ ] Include party membership in automatic channel assignment so all members reserve atomically or none do.
- [ ] Implement safe transfer states: preparing, reserved, entering, committed, rolled-back.
- [ ] Reuse reconnect leases and guarantee one active channel membership per account.
- [ ] Add client transfer/reconnect banners and actionable failure recovery.
- [ ] Verify party split count exactly zero under join, leave, reconnect, and failure injection.

### Task 4: Make private story and dungeon instances fully playable

**Files:**
- Modify: `apps/game-server/src/mmo/instances/MmoInstanceRoom.ts`
- Modify: `apps/game-server/src/mmo/instances/PrivateInstanceRegistry.ts`
- Create: `apps/game-server/src/mmo/instances/InstanceCombatSimulation.ts`
- Create: `apps/client/src/mmo/MmoInstanceClient.ts`
- Create: `apps/client/src/ui/mmo/MmoInstanceShell.tsx`
- Test: `apps/game-server/tests/mmo/instanceCombat.test.ts`
- Test: `apps/client/tests/MmoInstanceShell.test.tsx`
- Test: `tests/e2e/mmo-instance.spec.ts`

- [ ] Add deterministic story and dungeon encounter data with seeded layouts and safe checkpoints.
- [ ] Run the same three-hero automatic combat rules inside the instance worker.
- [ ] Implement ready-gated start, encounter completion, failure, recovery, and leader completion.
- [ ] Allow revive tokens only in configured dungeon encounters and consume them transactionally.
- [ ] Restore the latest committed checkpoint after reconnect or worker restart.
- [ ] Add client instance entry, ready state, checkpoint/recovery messaging, completion summary, and return-to-world flow.
- [ ] Verify one-to-four-player admission, no cross-instance visibility, checkpoint monotonicity, and reward idempotency.

### Task 5: Complete client world HUD and accessibility

**Files:**
- Modify: `apps/client/src/ui/mmo/MmoWorldShell.tsx`
- Modify: `apps/client/src/ui/mmo/mmo-shell.css`
- Modify: `apps/client/src/mmo/createMmoWorldGame.ts`
- Create: `apps/client/src/ui/mmo/MmoHeroStrip.tsx`
- Create: `apps/client/src/ui/mmo/MmoMinimap.tsx`
- Create: `apps/client/src/ui/mmo/MmoBossBanner.tsx`
- Create: `apps/client/src/ui/mmo/MmoRecoverySheet.tsx`
- Test: `apps/client/tests/MmoWorldHud.test.tsx`
- Test: `tests/e2e/mmo-mobile.spec.ts`

- [ ] Render the authoritative three-hero strip, HP/status state, target preference, Auto Hunt, activity, boss countdown, pending rewards, and transfer state.
- [ ] Add Phaser world entities for Leader, companions, monsters, and boss markers from authoritative snapshots.
- [ ] Add minimap and visual-effect degradation thresholds for mobile.
- [ ] Preserve landscape and portrait layouts, safe areas, reduced motion, keyboard/screen-reader labels, and 44px minimum targets.
- [ ] Run Playwright at `390x844`, `412x915`, and `740x360` with no overflow, clipping, or serious accessibility violations.

### Task 6: Cloud-backed social, instance, and checkpoint recovery

**Files:**
- Create: `supabase/migrations/20260804190100_mmo_social_instances.sql`
- Create: `supabase/tests/mmo_social_instances.sql`
- Modify: `apps/game-server/src/mmo/persistence/WorldCheckpointRepository.ts`
- Create: `apps/game-server/src/mmo/persistence/InstanceRepository.ts`
- Create: `apps/game-server/src/mmo/persistence/SocialRepository.ts`
- Test: `apps/game-server/tests/mmo/instanceRepository.test.ts`
- Test: `apps/game-server/tests/mmo/socialRepository.test.ts`

- [ ] Add additive tables for party membership, friend consent, instance checkpoints, revive-token balances, and channel-transfer audit.
- [ ] Apply RLS ownership and service-role-only transactional mutation functions.
- [ ] Verify stale writes, duplicate mutation identities, reconnect recovery, and no unauthorized social reads.
- [ ] Run remote transactional SQL verification and record migration evidence without repairing unrelated history.

### Task 7: Full adversarial, load, and recovery verification

**Files:**
- Create: `tests/load/thirty-player-mmo-world.ts`
- Create: `tests/load/four-party-instances.ts`
- Create: `tests/e2e/mmo-rollout.spec.ts`
- Create: `apps/game-server/tests/mmo/adversarialCommands.test.ts`
- Create: `docs/reports/mmorpg/completion-gate.md`
- Modify: `package.json`

- [ ] Test forged sessions, stale revisions, sequence replay, party conflicts, duplicate rewards, unauthorized checkpoints, and over-rate commands.
- [ ] Run 30-player channel soak with 90 heroes, 80 monsters, and one boss per channel.
- [ ] Run four concurrent private instances with reconnect and checkpoint fault injection.
- [ ] Verify p95 tick `<=25ms`, p99 tick `<=40ms`, movement acknowledgement p95 `<=150ms`, reconnect success `>=99.5%`, and duplicate rewards exactly `0`.
- [ ] Verify no population over 30, no simultaneous account memberships, and no committed progression loss.
- [ ] Record exact commands, metrics, failures, recovery times, and known defects.

### Task 8: Rollback rehearsal and staged rollout

**Files:**
- Create: `docs/runbooks/mmo-rollout.md`
- Modify: `.env.example`
- Modify: `docs/reports/mmorpg/completion-gate.md`

- [ ] Rehearse client-flag rollback to legacy entry in under five minutes.
- [ ] Rehearse server flag rollback while preserving legacy `floor_1` availability.
- [ ] Enable an internal cohort, then invited alpha, then opt-in beta; keep expansion blocked on any failed gate.
- [ ] Add monitoring for tick debt, channel crashes, transfer failures, persistence backlog, pending reward age, duplicate rejection, and progression anomalies.
- [ ] Approve release only when all correctness, persistence, mobile, security, and performance thresholds pass.

## Completion Definition

The system is complete only when Tasks 1–8 pass their focused tests, the full build passes, cloud verification passes, mobile browser checks pass at all required viewports, the load and adversarial gates meet the roadmap thresholds, rollback is rehearsed, and the legacy game remains available until staged rollout approval.
