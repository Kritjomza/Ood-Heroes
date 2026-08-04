import { Client, CloseCode, Room } from '@colyseus/core';
import {
  MmoProtocolValidationError,
  parseMmoCommandEnvelope,
  parseMmoEntryRequest,
} from '@odd-tower/network-protocol';
import type { AuthVerifier } from '../../auth/AuthVerifier.js';
import { isMmoEligible, type MmoFeatureFlags } from '../featureFlags.js';
import type { WorldDirectory, AssignmentResult } from '../directory/WorldDirectory.js';
import type {
  WorldCheckpoint,
  WorldCheckpointRepository,
} from '../persistence/WorldCheckpointRepository.js';
import { MmoTeamViewSchema, MmoZoneState } from './MmoZoneState.js';
import { TeamSimulation, type MmoTeamHero } from '../simulation/TeamSimulation.js';
import { EcologyDirector, type HabitatProfile } from '../ecology/EcologyDirector.js';
import type { PrivateInstanceRegistry } from '../instances/PrivateInstanceRegistry.js';
import { grantEncounterXp, type AdventureProgress, type MmoHeroProgress } from '@odd-tower/game-core';
import { RewardLedger } from '../rewards/RewardLedger.js';
import { BossActivityService } from '../activities/BossActivityService.js';
import type { EcologyMonster } from '../ecology/EcologyDirector.js';
import type { MmoProgressionRepository } from '../persistence/MmoProgressionRepository.js';
import type { MmoRewardRepository } from '../persistence/MmoRewardRepository.js';
import type { PartyRegistry } from '../social/PartyRegistry.js';
import type { MmoInstanceRepository } from '../persistence/MmoInstanceRepository.js';

export type MmoZoneRoomOptions = {
  flags: MmoFeatureFlags;
  authVerifier: AuthVerifier;
  directory: WorldDirectory;
  checkpoints: WorldCheckpointRepository;
  reconnectGraceSeconds?: number;
  instances?: PrivateInstanceRegistry;
  progression?: MmoProgressionRepository;
  rewards?: MmoRewardRepository;
  party?: PartyRegistry;
  instanceRepository?: MmoInstanceRepository;
};

type MmoAuthentication = {
  accountId: string;
  assignment: AssignmentResult;
  checkpoint: WorldCheckpoint | null;
  progression: { adventure: AdventureProgress; heroes: MmoHeroProgress[]; revision: number; updatedAt: string } | null;
};

export class MmoZoneRoom extends Room<{ state: MmoZoneState }> {
  private options!: MmoZoneRoomOptions;
  private reconnectGraceSeconds = 15;
  private readonly sessions = new Map<string, MmoAuthentication>();
  private readonly lastSequences = new Map<string, number>();
  private readonly simulation = new TeamSimulation();
  private ecology!: EcologyDirector;
  private readonly rewards = new RewardLedger();
  private readonly bossActivity = new BossActivityService();
  private bossEventId = '';
  private bossEcologyId = '';
  private bossRemainingHp = 0;
  private readonly bossPreviousHp = new Map<string, number>();
  private nextScheduledBossTick = 1200;
  private readonly progression = new Map<string, { adventure: AdventureProgress; heroes: MmoHeroProgress[] }>();
  private readonly progressionRevisions = new Map<string, number>();
  private readonly inFlightRewards = new Set<string>();

  onCreate(options: MmoZoneRoomOptions) {
    this.options = options;
    this.reconnectGraceSeconds = options.reconnectGraceSeconds ?? 15;
    this.maxClients = 30;
    this.patchRate = 50;
    this.maxMessagesPerSecond = 20;
    this.state = new MmoZoneState();
    this.ecology = new EcologyDirector(floorOneHabitat, { seed: hashSeed(this.roomId) });
    this.setSimulationInterval(() => {
      const ecology = this.ecology.tickZone();
      this.updateBossLifecycle(ecology);
      this.syncBossBeforeTick();
      this.simulation.tick();
      this.collectBossDamage();
      this.syncSimulationState();
      this.syncProgression();
      this.state.activeMonsterCount = ecology.filter((monster) => monster.status === 'alive' && !monster.boss).length;
      this.state.worldBossId = ecology.find((monster) => monster.status === 'alive' && monster.boss)?.id ?? '';
      this.state.zoneActivity = this.ecology.zoneActivity;
      this.state.bossCountdownTicks = this.bossEventId ? 0 : Math.max(0, this.nextScheduledBossTick - this.ecology.tick);
      this.state.pendingRewardCount = this.rewards.pendingCount();
    }, 50);
    this.onMessage('command', (client, value: unknown) => this.handleCommand(client, value));
  }

  async onAuth(_client: Client, options: unknown): Promise<MmoAuthentication> {
    const request = parseMmoEntryRequest(options);
    const identity = await this.options.authVerifier.verifyAccessToken(request.accessToken);
    if (!isMmoEligible(identity.userId, this.options.flags)) throw new Error('MMO_NOT_ELIGIBLE');
    const checkpoint = await this.options.checkpoints.load(identity.userId);
    const savedProgression = this.options.progression ? await this.options.progression.load(identity.userId) : null;
    const partyAccountIds = this.options.party?.members(identity.userId);
    const assignment = this.options.directory.assign({
      accountId: identity.userId,
      zoneId: checkpoint?.zoneId ?? 'floor-1',
      region: request.preferredRegion,
      nowMs: Date.now(),
      ...(partyAccountIds ? { partyAccountIds } : {}),
    });
    return { accountId: identity.userId, assignment, checkpoint, progression: savedProgression };
  }

  onJoin(client: Client, _options: unknown, authentication?: MmoAuthentication) {
    if (!authentication) throw new Error('AUTH_REQUIRED');
    if (this.state.channelId && this.state.channelId !== authentication.assignment.channelId) {
      this.options.directory.release(authentication.accountId, authentication.assignment.leaseId);
      throw new Error('CHANNEL_REDIRECT_REQUIRED');
    }
    this.sessions.set(client.sessionId, authentication);
    this.lastSequences.set(client.sessionId, -1);
    this.state.channelId = authentication.assignment.channelId;
    this.state.zoneId = authentication.checkpoint?.zoneId ?? 'floor-1';
    this.state.population = this.sessions.size;
    this.state.worldRevision += 1;
    this.state.connectionState = 'connected';
    this.simulation.addTeam(authentication.accountId, defaultHeroes(authentication.accountId));
    this.progression.set(authentication.accountId, authentication.progression ? {
      adventure: authentication.progression.adventure,
      heroes: authentication.progression.heroes,
    } : {
      adventure: { rank: 1, experience: 0 },
      heroes: defaultHeroes(authentication.accountId).map((hero) => ({ id: hero.id, level: hero.level, experience: 0 })),
    });
    this.progressionRevisions.set(authentication.accountId, authentication.progression?.revision ?? 0);
    for (const monster of defaultMonsters(authentication.accountId))
      this.simulation.addMonster(authentication.accountId, monster);
    if (this.bossEventId && this.bossRemainingHp > 0)
      this.addBossToTeam(authentication.accountId);
    this.syncSimulationState();
  }

  onDrop(client: Client, code?: number) {
    this.state.connectionState = 'recovering';
    if (code !== CloseCode.SERVER_SHUTDOWN)
      void this.allowReconnection(client, this.reconnectGraceSeconds);
  }

  onReconnect() {
    this.state.connectionState = 'connected';
    this.state.worldRevision += 1;
  }

  onLeave(client: Client) {
    const session = this.sessions.get(client.sessionId);
    if (session)
      this.options.directory.release(session.accountId, session.assignment.leaseId);
    this.sessions.delete(client.sessionId);
    this.lastSequences.delete(client.sessionId);
    if (session) this.simulation.removeTeam(session.accountId);
    if (session) this.progression.delete(session.accountId);
    if (session) this.progressionRevisions.delete(session.accountId);
    this.state.population = this.sessions.size;
    this.state.worldRevision += 1;
    this.state.connectionState = 'connected';
    this.state.teams.delete(session?.accountId ?? '');
  }

  onDispose() {
    for (const session of this.sessions.values())
      this.options.directory.release(session.accountId, session.assignment.leaseId);
    this.sessions.clear();
    this.lastSequences.clear();
  }

  private handleCommand(client: Client, value: unknown) {
    try {
      const envelope = parseMmoCommandEnvelope(value);
      if (envelope.sessionId !== client.sessionId) throw new Error('session_mismatch');
      if (envelope.worldRevision !== this.state.worldRevision)
        throw new Error('stale_world_revision');
      const previous = this.lastSequences.get(client.sessionId) ?? -1;
      if (envelope.sequence <= previous) throw new Error('stale_sequence');
      this.lastSequences.set(client.sessionId, envelope.sequence);
      const accountId = this.sessions.get(client.sessionId)?.accountId;
      if (!accountId) throw new Error('session_not_found');
      if (envelope.command.type === 'movement') this.simulation.movement(accountId, envelope.command.direction);
      if (envelope.command.type === 'auto-hunt') this.simulation.setAutoHunt(accountId, envelope.command.enabled);
      if (envelope.command.type === 'target-preference') this.simulation.setTargetPreference(accountId, envelope.command.targetId);
      if (envelope.command.type === 'party-invite') {
        if (!this.options.party) throw new Error('PARTY_UNAVAILABLE');
        const party = this.options.party.partyOf(accountId) ?? this.options.party.create(accountId);
        this.options.party.invite(party.partyId, accountId, envelope.command.targetAccountId);
      }
      if (envelope.command.type === 'party-accept') {
        if (!this.options.party) throw new Error('PARTY_UNAVAILABLE');
        this.options.party.accept(envelope.command.partyId, accountId);
      }
      if (envelope.command.type === 'party-leave') this.options.party?.leave(accountId);
      if (envelope.command.type === 'friend-consent') {
        if (!this.options.party) throw new Error('FRIENDS_UNAVAILABLE');
        if (envelope.command.granted) this.options.party.requestFriend(accountId, envelope.command.targetAccountId);
        else this.options.party.revokeFriend(accountId, envelope.command.targetAccountId);
      }
      this.syncSimulationState();
      this.syncProgression();
      this.ecology.recordActivity(1);
      this.state.worldRevision += 1;
      client.send('command-accepted', { sequence: envelope.sequence });
    } catch (error) {
      const code = error instanceof MmoProtocolValidationError ? error.code : String(error);
      client.send('error', { code });
    }
  }

  private syncSimulationState() {
    for (const session of this.sessions.values()) {
      const team = this.simulation.getTeam(session.accountId);
      if (!team) continue;
      const existing = this.state.teams.get(session.accountId);
      if (!existing) {
        this.state.teams.set(session.accountId, new MmoTeamViewSchema());
      }
      const target = this.state.teams.get(session.accountId)!;
      const leader = team.heroes.find((hero) => hero.id === team.leaderId)!;
      target.accountId = team.accountId;
      target.leaderX = leader.position.x;
      target.leaderY = leader.position.y;
      target.heroCount = team.heroes.length;
      target.aliveHeroCount = team.heroes.filter((hero) => hero.status === 'alive').length;
      target.autoHuntEnabled = team.autoHuntEnabled;
      target.autoHuntState = team.autoHuntState;
      target.weaknessUntilTick = team.weaknessUntilTick;
    }
  }

  private syncProgression() {
    void this.flushProgression();
  }

  private async flushProgression() {
    for (const session of this.sessions.values()) {
      const team = this.simulation.getTeam(session.accountId);
      const progression = this.progression.get(session.accountId);
      const view = this.state.teams.get(session.accountId);
      if (!team || !progression || !view) continue;
      for (const monster of team.monsters) {
        if (monster.status !== 'defeated' || !monster.defeatGeneration) continue;
        const identity = `${this.roomId}:${monster.id}:${monster.defeatGeneration}`;
        if (this.rewards.committed(identity)) continue;
        const entry = this.rewards.prepare({
          rewardIdentity: identity,
          accountId: session.accountId,
          payload: { experience: monster.experienceReward ?? 25 },
          createdAtMs: Date.now(),
        });
        if (this.options.rewards) {
          if (!this.inFlightRewards.has(identity)) {
            this.inFlightRewards.add(identity);
            void this.finalizePersistentReward(session.accountId, entry, progression).finally(() => {
              this.inFlightRewards.delete(identity);
            });
          }
        } else {
          this.applyEncounterXp(session.accountId, progression, monster.experienceReward ?? 25);
          this.rewards.commit(identity, Date.now());
        }
      }
      view.adventureRank = progression.adventure.rank;
      view.heroLevels = progression.heroes.map((hero) => hero.level).join(',');
    }
  }

  private async finalizePersistentReward(
    accountId: string,
    entry: ReturnType<RewardLedger['prepare']>,
    progression: { adventure: AdventureProgress; heroes: MmoHeroProgress[] },
  ) {
    const durable = await this.options.rewards!.prepare(entry);
    if (durable.status === 'committed') {
      this.rewards.commit(entry.rewardIdentity, Date.now());
      return;
    }
    this.applyEncounterXp(accountId, progression, Number(entry.payload.experience ?? 25));
    const revision = (this.progressionRevisions.get(accountId) ?? 0) + 1;
    const updatedAt = new Date().toISOString();
    const saved = this.options.progression ? await this.options.progression.saveIfNewer({
      accountId,
      adventure: progression.adventure,
      heroes: progression.heroes,
      revision,
      updatedAt,
    }) : 'saved';
    if (saved === 'saved') this.progressionRevisions.set(accountId, revision);
    await this.options.rewards!.commit(entry.rewardIdentity, Date.now());
    this.rewards.commit(entry.rewardIdentity, Date.now());
  }

  private applyEncounterXp(
    accountId: string,
    progression: { adventure: AdventureProgress; heroes: MmoHeroProgress[] },
    experience: number,
  ) {
    const grant = grantEncounterXp(
      progression.adventure,
      progression.heroes,
      progression.heroes.map((hero) => hero.id),
      [],
      experience,
    );
    progression.adventure = grant.adventure;
    progression.heroes = grant.heroes;
    this.progressionRevisions.set(accountId, (this.progressionRevisions.get(accountId) ?? 0) + 1);
  }

  private updateBossLifecycle(ecology: readonly EcologyMonster[]) {
    if (!this.bossEventId && this.ecology.tick >= this.nextScheduledBossTick) {
      const eventId = `scheduled-${this.roomId}-${this.nextScheduledBossTick}`;
      this.bossActivity.schedule(eventId, this.state.channelId || this.roomId, 'world-boss', 5_000);
      this.bossActivity.start(eventId);
      const spawned = this.ecology.spawnScheduledBoss(eventId);
      if (spawned) this.activateBoss(eventId, spawned.id, 5_000);
    }
    if (!this.bossEventId) {
      const dynamic = ecology.find((monster) => monster.boss && monster.status === 'alive');
      if (dynamic) {
        const eventId = `dynamic-${this.roomId}-${dynamic.id}`;
        this.bossActivity.schedule(eventId, this.state.channelId || this.roomId, dynamic.kind, 3_000);
        this.bossActivity.start(eventId);
        this.activateBoss(eventId, dynamic.id, 3_000);
      }
    }
    if (!this.bossEventId && this.ecology.tick >= this.nextScheduledBossTick - 300) {
      this.state.bossEventId = `scheduled-${this.roomId}-${this.nextScheduledBossTick}`;
      this.state.bossStatus = 'announced';
      this.state.bossCountdownTicks = Math.max(0, this.nextScheduledBossTick - this.ecology.tick);
    }
  }

  private activateBoss(eventId: string, ecologyId: string, hp: number) {
    this.bossEventId = eventId;
    this.bossEcologyId = ecologyId;
    this.bossRemainingHp = hp;
    this.state.bossEventId = eventId;
    this.state.bossStatus = 'active';
    this.state.bossCountdownTicks = 0;
    for (const session of this.sessions.values()) this.addBossToTeam(session.accountId);
  }

  private addBossToTeam(accountId: string) {
    const team = this.simulation.getTeam(accountId);
    if (!team || team.monsters.some((monster) => monster.id === this.bossEventId)) return;
    this.simulation.addMonster(accountId, {
      id: this.bossEventId,
      position: { x: 320, y: 320 },
      currentHp: this.bossRemainingHp,
      maxHp: this.bossRemainingHp,
      attack: 24,
      defense: 12,
      status: 'alive',
      experienceReward: 250,
    });
  }

  private syncBossBeforeTick() {
    if (!this.bossEventId || this.bossRemainingHp <= 0) return;
    for (const session of this.sessions.values()) {
      this.addBossToTeam(session.accountId);
      this.bossPreviousHp.set(session.accountId, this.bossRemainingHp);
      this.simulation.setMonsterState(session.accountId, this.bossEventId, this.bossRemainingHp, 'alive');
    }
  }

  private collectBossDamage() {
    if (!this.bossEventId || this.bossRemainingHp <= 0) return;
    let damage = 0;
    for (const session of this.sessions.values()) {
      const team = this.simulation.getTeam(session.accountId);
      const monster = team?.monsters.find((entry) => entry.id === this.bossEventId);
      const before = this.bossPreviousHp.get(session.accountId) ?? this.bossRemainingHp;
      if (monster) {
        const dealt = Math.max(0, before - monster.currentHp);
        if (dealt > 0) {
          damage += dealt;
          this.bossActivity.recordContribution(this.bossEventId, session.accountId, dealt, this.ecology.tick);
        }
      }
    }
    if (damage <= 0) return;
    this.bossRemainingHp = Math.max(0, this.bossRemainingHp - damage);
    this.state.bossContributionTotal = this.bossActivity.get(this.bossEventId).totalContribution;
    if (this.bossRemainingHp === 0) {
      this.bossActivity.finish(this.bossEventId, new Date().toISOString().slice(0, 10));
      if (this.bossEcologyId) this.ecology.defeat(this.bossEcologyId);
      this.state.bossStatus = 'finished';
      for (const session of this.sessions.values()) this.simulation.setMonsterState(session.accountId, this.bossEventId, 0, 'defeated');
      if (this.bossEventId.startsWith('scheduled-')) this.nextScheduledBossTick = this.ecology.tick + 2_400;
      this.bossEventId = '';
      this.bossEcologyId = '';
      this.bossRemainingHp = 0;
      this.bossPreviousHp.clear();
    } else {
      for (const session of this.sessions.values()) this.simulation.setMonsterState(session.accountId, this.bossEventId, this.bossRemainingHp, 'alive');
    }
  }
}

function defaultHeroes(accountId: string): MmoTeamHero[] {
  return [
    hero(`${accountId}:leader`, 'fighter', 100, 40, 10),
    hero(`${accountId}:tank`, 'tank', 120, 20, 20),
    hero(`${accountId}:support`, 'support', 80, 15, 8),
  ];
}

function hero(id: string, role: MmoTeamHero['role'], maxHp: number, attack: number, defense: number): MmoTeamHero {
  return { id, role, position: { x: 0, y: 0 }, currentHp: maxHp, maxHp, attack, defense, level: 1, cooldownTicks: 1, status: 'alive' };
}

function defaultMonsters(accountId: string) {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `${accountId}:monster:${index + 1}`,
    position: { x: 64 + index * 48, y: index % 2 === 0 ? 0 : 48 },
    currentHp: 180,
    maxHp: 180,
    attack: 8,
    defense: 4,
    status: 'alive' as const,
    experienceReward: 25,
  }));
}

const floorOneHabitat: HabitatProfile = {
  id: 'floor-1',
  spawnPoints: [
    { x: 320, y: 320 },
    { x: 480, y: 320 },
    { x: 640, y: 320 },
    { x: 800, y: 320 },
    { x: 320, y: 480 },
    { x: 480, y: 480 },
    { x: 640, y: 480 },
    { x: 800, y: 480 },
  ],
  targetPopulation: 12,
  maxPopulation: 30,
  respawnDelayTicks: 100,
  monsterKinds: ['grumpy-radish', 'lost-pudding', 'wild-sausage'],
};

function hashSeed(value: string) {
  let hash = 0x811c9dc5;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  return hash >>> 0;
}
