# Shard-Oriented MMORPG World Design

## Status

Approved design for a controlled, parallel rewrite of Odd Tower's online adventure runtime. The existing game remains available until the replacement passes every release gate defined here and the concrete Go/No-Go thresholds established during implementation planning.

## Product Goal

Transform Odd Tower's online adventure into a persistent, mobile-first MMORPG built around automatically assigned public channels of approximately 10–30 players. Players control the movement of one Leader Hero while a three-hero team fights automatically. Public zones support shared activities and channel-local bosses; story missions and dungeons run as private 1–4-player instances. Room codes remain an optional private-play feature.

The replacement is a new shard-oriented server and persistent world model built alongside the existing system. It reuses proven combat rules, hero definitions, formulas, pathfinding concepts, deterministic randomness, and test fixtures where practical, but it does not promote existing room classes into the new runtime.

## Core Product Decisions

- Public zones use automatically assigned persistent channel instances with approximately 10–30 connected players.
- Channel placement prioritizes parties, consented friend following, reconnect reservations, latency, population suitability, and capacity.
- A standard party contains up to four players, each fielding three heroes, for at most 12 party heroes.
- The player directly controls only Leader movement and optional target preference.
- Basic attacks and skill use are always automatic for all three heroes.
- Auto Hunt is a separate toggle that automates movement, target acquisition, fighting, recovery, and farming.
- Adventure Rank is account-wide; Hero Levels are individual and capped by Adventure Rank.
- All deployed heroes receive full eligible XP. Reserve heroes receive partial XP and benefit from bounded catch-up bonuses and XP items.
- Scheduled world bosses appear separately in every eligible channel. Dynamic zone bosses arise from shared zone activity.
- Full-team defeat returns the team to the nearest sanctuary at full HP with temporary weakness and Auto Hunt disabled.
- The initial release excludes free-text public chat until moderation and privacy safeguards are production-ready.

## 1. World and Server Architecture

### World Directory

The World Directory tracks regions, shard health, channel population and capacity, boss schedules, party placement, permitted friend-follow relationships, reconnect reservations, and transfer leases. It assigns players to channels and issues short-lived, single-use transfer tickets.

Assignment priority is:

1. Keep an active party together.
2. Honor an accepted friend-follow request when capacity permits.
3. Restore a valid reconnect reservation.
4. Prefer suitable latency and a healthy population band.
5. Use general channel capacity.

An established party is never silently split. If no destination can fit the entire party, the UI offers queueing, a coordinated party transfer, or continued play in the current channel.

### Zone Shards

Zone Shards run authoritative fixed-step simulations and host multiple independent channel instances. Each channel owns its connected players, three-hero formations, ecology state, monsters, shared activities, boss instances, sanctuary state, contribution records, and ephemeral combat state.

Channels are simulation boundaries rather than durable progression boundaries. Moving between channels never resets Adventure Rank, Hero Levels, inventory, quests, daily eligibility, or other confirmed account state.

### Private Instance Workers

Private Instance Workers host story missions, dungeons, and optional room-code expeditions for 1–4 players. They use the same deterministic combat kernel as public zones but define separate entry requirements, completion rules, difficulty, checkpoint policy, revive-token policy, reward tables, and shutdown lifecycle.

### Persistent World Services

Supabase/Postgres stores account progression, roster state, Adventure Rank, Hero Levels, quests, inventory, currencies, friendships, parties, checkpoints, boss eligibility, reward transactions, and durable instance results. Fast-changing position and combat state remain in memory and are converted into durable state only at explicit transaction or checkpoint boundaries.

### Deterministic Combat Kernel

Reusable `game-core` behavior becomes a versioned deterministic kernel. It owns hero definitions, formulas, cooldowns, automatic targeting, role priorities, status effects, seeded randomness, contribution inputs, and other portable rules. Runtime adapters provide world queries, persistence commands, and protocol projection.

Network commands and snapshots carry explicit protocol versions and monotonic revisions. Incompatible clients are rejected with a safe update response before joining a world simulation.

### Safe Transfers

Transfers follow `prepare -> checkpoint -> handoff -> acknowledge`:

1. The source channel requests a destination lease.
2. Persistent services confirm the last durable player checkpoint.
3. The World Directory issues a short-lived, single-use handoff ticket.
4. The destination validates the ticket and creates the player session.
5. The destination acknowledges ownership before the source releases its lease.

Failure restores the source lease when possible. Otherwise the player enters a safe recovery session at a valid sanctuary. Transfer retries cannot duplicate players, rewards, inventory, or encounter completion.

## 2. Core World and Combat Simulation

### Authority and Client Commands

The server owns formation movement, collision, targeting decisions, skill selection, cooldowns, damage, healing, threat, status effects, death, spawning, rewards, and progression. Clients may send only:

- Leader movement intent.
- A target preference.
- Auto Hunt enabled or disabled.
- A contextual interaction request.
- Valid menu, party, matchmaking, and instance commands outside combat.

Manual movement immediately disables Auto Hunt navigation. It does not disable automatic basic attacks or automatic skills.

### Three-Hero Formation

The Leader follows validated player movement intent. Two companions occupy role-aware formation slots and use collision avoidance and bounded steering. They recover deterministically when stuck. Catch-up warping is permitted only when the companion is safely off-screen, is not resolving an encounter mechanic, and cannot create combat advantage.

All three heroes choose attacks and skills automatically from deterministic priorities including role, range, cooldown, threat, ally health, enemy state, and encounter mechanics. There are no manual attack, skill, or dodge controls.

### Auto Hunt

Auto Hunt adds automated target acquisition, navigation, farming-area boundaries, combat engagement, sanctuary retreat, recovery, and resumption. It does not use different combat rules from manual movement. The server owns the Auto Hunt state machine and rejects unreachable or repeatedly invalid targets with bounded retries.

### Ecology-Based Spawning

Each zone defines ecology profiles containing species weights, level bands, habitat polygons, target populations, density limits, spawn separation, player-density scaling, and respawn timing. A seeded spawn director maintains populations without placing enemies:

- Inside sanctuaries or transfer arrival areas.
- Inside blocked navigation geometry.
- Within an unsafe radius of players.
- In the active camera view when avoidable.
- Above per-habitat or per-channel population limits.

Spawning uses stable seeds and monotonic spawn identifiers so server recovery and tests can reproduce decisions.

### Monster Movement and AI

Monsters use bounded states: idle, wander, investigate, aggro, pursue, fight, leash, evade, return, defeated, and respawning. Spatial queries and expensive path decisions run at lower frequencies than core combat ticks. Monsters use local steering first and bounded pathfinding fallback when obstructed.

Leashing clears invalid threat and prevents attacks and rewards while evading. Repeated unreachable targets are temporarily blacklisted. A monster returning home cannot be dragged indefinitely or used to generate contribution without risk.

### Progression

Adventure Rank unlocks zones, systems, bosses, and difficulty tiers. Hero Levels provide individual character growth and cannot exceed the cap derived from current Adventure Rank.

All three deployed heroes receive full eligible encounter XP. Reserve heroes receive a configured partial share. Catch-up multipliers apply below a rank-relative threshold and taper as a hero approaches the cap. XP items obey the same cap and cannot overflow into an unearned future rank.

Rewards are keyed by transactional encounter IDs. Reconnection, transfer, worker retry, and database retry return the original outcome instead of producing another reward.

### Bosses

Scheduled world bosses use a published server-owned timetable and spawn separately in each eligible channel. The client receives advance announcements, a countdown, map state, and final encounter state from authoritative schedule revisions.

Contribution accounts for damage, effective healing, mitigation, encounter mechanics, and active presence. Last hit has no special reward privilege. The best reward rolls are limited per account per configured daily window; repeat participation may still grant a modest, explicitly defined reward.

Dynamic zone bosses spawn when shared channel activity meters meet transparent thresholds and all cooldown and population requirements are satisfied. Their progress keeps public zones active between scheduled bosses.

### Defeat and Respawning

A full-team defeat selects the nearest valid sanctuary by reachable navigation cost, restores all heroes at full HP, applies a short non-stacking weakness effect, and disables Auto Hunt. No XP, currency, or durability is lost.

Quick Return provides a safe route toward the previous farming area. It never spawns the player inside active aggro, a boss mechanic, or blocked geometry. Limited nearby revival tokens are available only in explicitly designated boss or dungeon content and are disclosed before entry.

## 3. Mobile-First Gameplay and UI

Phaser renders the world. React owns the accessible HUD, navigation, sheets, alerts, social flows, connection states, and account surfaces. UI state is event-driven rather than polled from the simulation.

### Primary HUD

- **Top-left:** Leader portrait, team HP summary, Adventure Rank, and compact status effects.
- **Top-center:** zone name, channel population, activity meter, and contextual boss countdown.
- **Top-right:** minimap with sanctuary, party, objective, boss, and transfer markers.
- **Bottom-left:** floating movement joystick with adjustable size and handedness.
- **Bottom-center:** three hero panels showing HP, Hero Level, role, automatic skill activity, defeat state, and formation status.
- **Bottom-right:** Auto Hunt toggle, target-priority control, and contextual Interact button.
- **Screen edges:** bounded alerts for XP, loot, rank unlocks, party events, boss announcements, connection recovery, and transfers.

The only primary gameplay controls are movement, target preference, Auto Hunt, and contextual interaction. Tapping an enemy supplies a preference without overriding server AI, range, threat, or encounter rules. Optional tap-to-move may exist as an accessibility setting but is not the default movement model.

### Adventure Dock and Sheets

A thumb-reachable dock opens a single managed screen stack containing:

- Character and active formation.
- Hero roster, roles, AI priorities, Hero Levels, reserve XP, catch-up status, and XP items.
- Inventory, consumables, currencies, pending rewards, and reward history.
- World map, unlocked zones, sanctuaries, channels, boss schedules, and Quick Return.
- Quests, story missions, shared activities, and dungeon matchmaking.
- Party, friends, nearby players, invitations, follow requests, blocks, and private room codes.
- Notifications, mail, announcements, help, settings, account, and accessibility.

Combat-critical warnings may appear above an open sheet. Other overlays use one stack and cannot create conflicting modal layers.

### Entry, Parties, and Transfers

`Continue Adventure` loads the last confirmed safe checkpoint, performs automatic channel assignment, and joins the player without exposing room codes. Party leaders can queue eligible 1–4-player content; all members receive a compact ready check.

Friend following is consent-based. Full-channel and party-capacity failures produce explicit choices. Reconnection and transfer lock movement, preserve the last confirmed display state, and clearly distinguish committed rewards from pending rewards.

### Boss UI and Visual Scalability

Boss presentation includes an advance banner, optional reminder, map pulse, final countdown, contribution view, mechanic warnings, and post-fight reward summary. Effects degrade by distance and importance. Local heroes and encounter mechanics retain clarity; distant players use simplified animation, lower particle budgets, compact nameplates, and aggregated combat text.

### Responsive and Accessible Behavior

Landscape is the primary composition. Portrait collapses the minimap, uses a vertical HUD, and places hero panels in a swipeable strip. Short landscape hides secondary labels and decorative effects before hiding gameplay state.

Controls respect safe-area insets and use at least 44–48 CSS-pixel touch targets. Layout supports English and Thai reflow, browser zoom, scalable text, left-handed play, reduced motion, high contrast, color-independent state cues, optional haptics, keyboard navigation for menus, visible focus, and screen-reader labels.

## 4. Persistence, Social Systems, and Activities

### Transactional Persistence

All durable mutations pass through server-owned commands and an append-only transaction ledger. Adventure Rank, Hero XP, inventory, quest progress, boss eligibility, dungeon completion, checkpoints, and currencies update atomically.

Combat workers submit encounter results containing protocol version, encounter ID, participants, contribution, reward-table version, and deterministic evidence. Retries resolve to the original ledger entry.

Durable checkpoints occur at sanctuary arrival, instance entry and exit, channel transfer, quest completion, boss resolution, and bounded periodic intervals. A crash may lose a small amount of unconfirmed position but cannot duplicate or partially commit rewards, consumables, or completion.

Pending rewards appear in the UI with their reason and retry state. They cannot be spent, consumed, equipped, traded, or counted toward unlocks until their ledger transaction is committed.

### Parties and Matchmaking

Parties persist independently of channel connections. A party owns leader, membership, ready, matchmaking, and active-instance state. Disconnects retain membership for a grace period. Matchmaking considers activity tier, regional latency, Adventure Rank eligibility, party size, and wait time. It never silently changes selected difficulty or splits a premade group.

### Friends, Privacy, and Private Play

Friend presence exposes coarse states such as offline, available, in zone, or in activity. Exact location is shared only with permission. Blocks override invitations, presence, follow requests, future chat, and matchmaking interactions.

Room codes create optional private expeditions or instance sessions. They do not replace public automatic assignment and are visually secondary in the social interface.

### Shared Activities and Rewards

Public zones support ecology events, defense, escort, collection, elite hunts, dynamic bosses, scheduled world bosses, sanctuary services, rotating NPC tasks, and public quest objectives with individual credit.

Contribution windows value support actions alongside damage. Parties share valid kill and objective credit within bounded participation range. Rewards are rolled individually and persisted transactionally. AFK eligibility checks prevent passive boss rewards without treating ordinary configured Auto Hunt farming as an exploit.

### Initial Social Scope

The initial runtime includes parties, friends, presence, consented following, nearby-player inspection, blocking, invitations, and preset quick messages. Free-text public chat remains disabled until moderation, reporting, rate limiting, retention, age and privacy controls, and operational review are production-ready.

### Recovery States

- Database delay queues idempotent writes and marks affected rewards as pending.
- Channel failure routes sessions through the World Directory to a valid sanctuary recovery session.
- Transfer failure restores the source lease or starts safe recovery.
- Version mismatch blocks entry before state mutation.
- Every recovery state provides a visible status, bounded retry behavior, and a safe user action.

## 5. Verification, Migration, and Release Gates

### Parallel Migration

The new runtime uses isolated entry points, versioned protocols, additive database migrations, and account-level feature flags. Legacy tables, endpoints, rooms, and routes remain available during rollout. Unsupported clients continue using the existing game.

Migration stages are:

1. Offline deterministic combat parity.
2. Internal single-player channel.
3. Internal multiplayer channel with persistence.
4. Private invited alpha using copied or disposable progression.
5. Opt-in production beta with real additive progression.
6. Cohort rollout with immediate rollback controls.
7. Default new-world entry after all reliability thresholds pass.
8. Legacy retirement only through a separate reviewed and approved plan.

### Test Layers

- Deterministic tests for combat, targeting, role AI, formations, progression, XP, spawning, contribution, weakness, and revive rules.
- Property and invariant tests for HP, rewards, inventory, XP, cooldowns, population, encounter ownership, and channel membership.
- Long-running simulation tests for Auto Hunt, ecology stability, boss schedules, leashing, sanctuary recovery, transfers, and instance lifecycle.
- Protocol compatibility and incompatibility tests.
- Database tests for atomicity, idempotency, retries, pending rewards, daily limits, checkpoints, and concurrent updates.
- Adversarial tests for forged commands, speed abuse, target spam, reward replay, transfer duplication, stale revisions, and unauthorized social actions.
- Browser tests for core mobile journeys, orientation, safe areas, virtual keyboards, background/resume, reduced motion, accessibility, poor networks, reconnection, and transfer.
- Load and soak tests for 30 players, 90 player heroes, configured ecology populations, shared activities, and channel-local bosses, including multiple channels per shard.

### Performance and Observability

The implementation plan must define numerical Go/No-Go thresholds for:

- Simulation tick rate and worst-case tick duration.
- Command acknowledgement and snapshot latency.
- Snapshot size and bandwidth.
- AI, spatial-query, and pathfinding work budgets.
- Transfer success and recovery rates.
- Persistence latency, backlog, and pending-reward age.
- Duplicate-reward and invalid-state counts, which must remain zero.
- Disconnect and reconnect success rates.
- Matchmaking wait and party-split counts.
- Mobile frame pacing, memory, load time, and thermal stability on named representative devices.

Metrics and alerts cover tick health, latency, disconnects, transfers, persistence lag, pending rewards, duplicate prevention, AI cost, matchmaking, boss participation, and progression anomalies.

### Gate Requirements

Every rollout stage requires passing automated suites, prescribed soak evidence, observability dashboards, incident procedures, rollback rehearsal, and no unresolved critical or high-severity defects. Release claims are evidence-based: the goal is no known severe defects, passing invariants and recovery paths, and measured performance within the agreed budgets—not an unverifiable promise of absolute bug absence.

The legacy game remains available until the new runtime passes combat parity, persistence correctness, crash and disconnect recovery, exploit resistance, 30-player load, and representative mobile-browser performance gates.

## Non-Goals for the Initial Release

- Free-text public chat.
- PvP, guilds, trading, auction houses, or player economies.
- Manual attacks, manual skill buttons, or dodge controls.
- More than four players in a standard party.
- Cross-channel world-boss health or last-hit rewards.
- Destructive migration or early removal of the current online game.
- Nearby revival outside explicitly designated token-enabled encounters.

## Implementation Planning Requirements

The implementation plan must decompose the rewrite into independently testable vertical slices, define the ownership boundary between the deterministic kernel and runtime adapters, specify additive schemas and versioned protocols, and attach concrete Go/No-Go metrics to every rollout gate. It must also define rollback procedures before any production cohort receives the new runtime.
