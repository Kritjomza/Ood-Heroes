import { Client, CloseCode, Room } from '@colyseus/core';
import {
  HERO_DEFINITIONS,
  effectiveHeroStats,
  safePlayerSpawn,
  type HeroRole,
} from '@odd-tower/game-core';
import {
  NETWORK_CONFIG,
  validateAuthenticatedJoinOptions,
  validateClientCommand,
  validateJoinOptions,
  type PlayerBootstrap,
  type JoinOptions,
} from '@odd-tower/network-protocol';
import { RoomCodeRegistry } from '../lobby/RoomCodeRegistry.js';
import {
  FloorOneState,
  HeroCombatSchema,
  MonsterSchema,
  PlayerCombatSchema,
  PlayerSchema,
  StatusEffectSchema,
} from '../schema/RoomState.js';
import {
  acceptPlayerCommand,
  createSimulationPlayer,
  stopPlayer,
  tickPlayer,
  type SimulationPlayer,
} from '../simulation/playerSimulation.js';
import { ClientRateLimiter } from '../validation/rateLimiter.js';
import { CombatSimulation, type CombatHeroInput } from '../simulation/CombatSimulation.js';
import { FixedStepScheduler } from '../simulation/FixedStepScheduler.js';
import { SimulationMetrics } from '../simulation/SimulationMetrics.js';
import { assignChanged, statusEffectSignature } from './schemaProjection.js';

import type { AuthVerifier } from '../auth/AuthVerifier.js';
import type { ActiveUserRegistry } from '../auth/ActiveUserRegistry.js';
import type { PlayerPersistenceService } from '../persistence/persistence-types.js';
import type { PersistenceQueue } from '../persistence/PersistenceQueue.js';
import type { PersistenceHealth } from '../persistence/PersistenceHealth.js';

type RoomOptions = {
  registry: RoomCodeRegistry;
  reconnectGraceSeconds?: number;
  authVerifier?: AuthVerifier;
  persistence?: PlayerPersistenceService;
  activeUsers?: ActiveUserRegistry;
  persistenceQueue?: PersistenceQueue;
  persistenceHealth?: PersistenceHealth;
};
type PersistentRoomAuth = {
  userId: string;
  displayName: string;
  bootstrap: PlayerBootstrap;
};

export class FloorOneRoom extends Room<{
  state: FloorOneState;
  metadata: Record<string, unknown>;
}> {
  private registry!: RoomCodeRegistry;
  private readonly simulations = new Map<string, SimulationPlayer>();
  private readonly rateLimiter = new ClientRateLimiter();
  private readonly focusRateLimiter = new ClientRateLimiter({
    ratePerSecond: NETWORK_CONFIG.focusRatePerSecond,
    burst: NETWORK_CONFIG.focusRatePerSecond,
    disconnectThreshold: NETWORK_CONFIG.abuseDisconnectThreshold,
  });
  private readonly autoHuntRateLimiter = new ClientRateLimiter({
    ratePerSecond: NETWORK_CONFIG.autoHuntRatePerSecond,
    burst: NETWORK_CONFIG.autoHuntRatePerSecond,
    disconnectThreshold: NETWORK_CONFIG.abuseDisconnectThreshold,
  });
  private reconnectGraceSeconds: number = NETWORK_CONFIG.reconnectGraceSeconds;
  private combat!: CombatSimulation;
  private readonly publishedCombatEvents = new Set<string>();
  private fixedStep = new FixedStepScheduler(NETWORK_CONFIG.tickMs, 2);
  private readonly simulationMetrics = new SimulationMetrics();
  private readonly effectSignatures = new WeakMap<HeroCombatSchema, string>();
  private schemaValuesUpdated = 0;
  private effectArraysRebuilt = 0;
  private authVerifier: AuthVerifier | undefined;
  private persistence: PlayerPersistenceService | undefined;
  private activeUsers: ActiveUserRegistry | undefined;
  private persistenceQueue: PersistenceQueue | undefined;
  private persistenceHealth: PersistenceHealth | undefined;
  private readonly identities = new Map<string, string>();

  async onCreate(options: RoomOptions) {
    this.registry = options.registry;
    this.authVerifier = options.authVerifier;
    this.persistence = options.persistence;
    this.activeUsers = options.activeUsers;
    this.persistenceQueue = options.persistenceQueue;
    this.persistenceHealth = options.persistenceHealth;
    if (this.persistenceQueue) this.fixedStep = new FixedStepScheduler(NETWORK_CONFIG.tickMs, 4);
    this.reconnectGraceSeconds =
      options.reconnectGraceSeconds ?? NETWORK_CONFIG.reconnectGraceSeconds;
    this.maxClients = NETWORK_CONFIG.roomCapacity;
    this.patchRate = 1000 / NETWORK_CONFIG.patchHz;
    this.maxMessagesPerSecond = Infinity;
    const roomCode = this.registry.register(this.roomId, this.maxClients);
    this.state = new FloorOneState();
    this.state.roomId = this.roomId;
    this.state.roomCode = roomCode;
    this.state.maxPlayers = this.maxClients;
    this.combat = new CombatSimulation(this.roomId);
    this.projectCombat();
    await this.setMetadata({ roomCode, floorId: 'floor_1' });
    this.onMessage('command', (client, value: unknown) => this.handleCommand(client, value));
    this.setSimulationInterval((deltaMs) => this.simulate(deltaMs), NETWORK_CONFIG.tickMs);
  }

  async onAuth(_client: Client, options: unknown) {
    if (this.authVerifier && this.persistence && this.activeUsers) {
      const validated = validateAuthenticatedJoinOptions(options);
      if (!validated.ok) throw new Error(validated.code);
      const identity = await this.authVerifier.verifyAccessToken(validated.value.accessToken);
      const reservation = this.activeUsers.reserve(identity.userId, this.roomId);
      if (!reservation.ok) throw new Error(reservation.code);
      try {
        const bootstrap = await this.persistence.bootstrap(identity.userId);
        return {
          userId: identity.userId,
          displayName: bootstrap.profile.displayName,
          bootstrap,
        } satisfies PersistentRoomAuth;
      } catch (error) {
        this.activeUsers.release(identity.userId, this.roomId);
        throw error;
      }
    }
    const result = validateJoinOptions(options);
    if (!result.ok) throw new Error(result.code);
    return result.value;
  }

  onJoin(client: Client, options: JoinOptions, authentication?: PersistentRoomAuth | JoinOptions) {
    const persistent = authentication && 'bootstrap' in authentication ? authentication : undefined;
    const validated = persistent ? null : validateJoinOptions(options);
    if (validated && !validated.ok) throw new Error(validated.code);
    const displayName = persistent?.displayName ?? validated!.value.displayName;
    const spawn = safePlayerSpawn(this.state.players.size);
    const simulation = createSimulationPlayer(client.sessionId, displayName, spawn);
    this.simulations.set(client.sessionId, simulation);
    this.combat.addPlayer(
      client.sessionId,
      persistent ? persistentCombatHeroes(persistent.bootstrap) : undefined,
    );
    if (persistent) this.identities.set(client.sessionId, persistent.userId);
    const player = new PlayerSchema();
    Object.assign(player, simulation.state);
    this.state.players.set(client.sessionId, player);
    this.projectCombat();
    this.updateMetadata();
  }

  onDrop(client: Client, code?: number) {
    const simulation = this.simulations.get(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (simulation) {
      simulation.state.connected = false;
      stopPlayer(simulation);
      this.combat.disconnectPlayer(client.sessionId);
    }
    if (player) {
      player.connected = false;
      player.direction = 'none';
      player.moving = false;
    }
    if (code !== CloseCode.SERVER_SHUTDOWN)
      void this.allowReconnection(client, this.reconnectGraceSeconds);
  }

  onReconnect(client: Client) {
    const simulation = this.simulations.get(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (simulation) {
      simulation.state.connected = true;
      simulation.lastValidInputAtMs = Date.now();
      stopPlayer(simulation);
      this.combat.reconnectPlayer(client.sessionId);
    }
    if (player) player.connected = true;
  }

  onLeave(client: Client) {
    const userId = this.identities.get(client.sessionId);
    if (userId) this.activeUsers?.release(userId, this.roomId);
    this.identities.delete(client.sessionId);
    this.simulations.delete(client.sessionId);
    this.combat.removePlayer(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.rateLimiter.remove(client.sessionId);
    this.focusRateLimiter.remove(client.sessionId);
    this.autoHuntRateLimiter.remove(client.sessionId);
    this.updateMetadata();
  }

  onDispose() {
    this.simulations.clear();
    this.identities.clear();
    this.activeUsers?.releaseRoom(this.roomId);
    this.publishedCombatEvents.clear();
    this.combat.dispose();
    this.fixedStep.reset();
    this.simulationMetrics.clear();
    this.registry.removeByRoomId(this.roomId);
  }

  private handleCommand(client: Client, value: unknown) {
    const command = validateClientCommand(value);
    if (!command.ok) {
      client.send('error', { code: command.code });
      return;
    }
    const limiter =
      command.value.type === 'focus-target'
        ? this.focusRateLimiter
        : command.value.type === 'auto-hunt'
          ? this.autoHuntRateLimiter
          : this.rateLimiter;
    const rate = limiter.consume(client.sessionId, Date.now());
    if (rate !== 'accepted') {
      client.send('error', { code: 'RATE_LIMITED' });
      if (rate === 'disconnect') client.leave(4008, 'Persistent command rate exceeded');
      return;
    }
    const simulation = this.simulations.get(client.sessionId);
    if (!simulation) return;
    if (command.value.type === 'focus-target') {
      if (!this.combat.focusTarget(client.sessionId, command.value.targetMonsterId))
        client.send('error', { code: 'INVALID_FOCUS_TARGET' });
      this.projectCombat();
      return;
    }
    if (command.value.type === 'auto-hunt') {
      if (!this.combat.setAutoHunt(client.sessionId, command.value.enabled))
        client.send('error', { code: 'INVALID_AUTO_HUNT' });
      this.projectCombat();
      return;
    }
    if (command.value.type === 'complete-floor-one') {
      const result = this.combat.completeFloorOnePortal(
        client.sessionId,
        command.value.requestId,
        command.value.manualEntry,
      );
      client.send('floor-one-completion', result);
      this.projectCombat();
      return;
    }
    const result = acceptPlayerCommand(simulation, command.value, Date.now());
    if (result !== 'accepted') {
      client.send('error', { code: 'STALE_SEQUENCE' });
      return;
    }
    if (command.value.type === 'move' && command.value.direction !== 'none')
      this.combat.manualMovement(client.sessionId, command.value.direction);
    if (command.value.type === 'heartbeat')
      client.send('heartbeat', { clientSentAtMs: command.value.clientSentAtMs });
  }

  diagnostics() {
    return {
      ...this.combat.diagnostics(),
      ...this.simulationMetrics.snapshot(),
      ...this.fixedStep.diagnostics(),
      connectedPlayers: this.simulations.size,
      schemaValuesUpdated: this.schemaValuesUpdated,
      effectArraysRebuilt: this.effectArraysRebuilt,
    };
  }

  applyTestControl(action: string, displayName: string) {
    if (process.env.ODD_TOWER_TEST_MODE !== '1') return { ok: false, code: 'TEST_MODE_DISABLED' };
    const entry = [...this.simulations.entries()].find(
      ([, simulation]) => simulation.state.displayName === displayName,
    );
    if (!entry) return { ok: false, code: 'PLAYER_NOT_FOUND' };
    const [playerId, simulation] = entry;
    if (action === 'low-hp') {
      Object.assign(simulation.state, { x: 500, y: 500, direction: 'none', moving: false });
      return { ok: this.combat.forceLowHp(playerId), playerId };
    }
    if (action === 'team-wipe') return { ok: this.combat.forceTeamWipe(playerId), playerId };
    if (action === 'wall-navigation') {
      Object.assign(simulation.state, { x: 656, y: 816, direction: 'none', moving: false });
      return { ok: true, playerId, monsterId: this.combat.setupWallNavigation(playerId) };
    }
    if (action === 'tap-target')
      return { ok: true, playerId, monsterId: this.combat.setupTapTarget(playerId) };
    if (action === 'prepare-shared-death')
      return { ok: true, playerId, monsterId: this.combat.prepareSharedMonsterDeath() };
    if (action === 'finish-shared-death')
      return { ok: this.combat.finishSharedMonsterDeath(playerId), playerId };
    return { ok: false, code: 'UNKNOWN_TEST_ACTION' };
  }

  private simulate(deltaMs: number) {
    const advance = this.fixedStep.advance(deltaMs);
    for (let step = 0; step < advance.steps; step++) {
      const startedAt = performance.now();
      const now = Date.now();
      for (const [id, simulation] of this.simulations) {
        tickPlayer(simulation, now);
        const player = this.state.players.get(id);
        if (player) this.assignChanged(player, simulation.state);
      }
      this.combat.tick(this.simulations);
      for (const event of this.combat.drainEvents()) {
        if (this.publishedCombatEvents.has(event.id)) continue;
        this.publishedCombatEvents.add(event.id);
        this.broadcast('combat-event', event);
        if (
          event.type === 'reward-granted' &&
          event.playerId &&
          event.rewardIdentity &&
          event.heroExperience !== undefined
        )
          this.enqueuePersistentReward(event);
      }
      while (this.publishedCombatEvents.size > 256)
        this.publishedCombatEvents.delete(this.publishedCombatEvents.values().next().value!);
      for (const [id, simulation] of this.simulations) {
        const player = this.state.players.get(id);
        if (player) this.assignChanged(player, simulation.state);
      }
      const duration = performance.now() - startedAt;
      this.simulationMetrics.recordTick(duration, duration > NETWORK_CONFIG.tickMs);
    }
    if (advance.steps > 0) this.projectCombat();
  }

  private enqueuePersistentReward(event: {
    playerId?: string;
    rewardIdentity?: string;
    amount?: number;
    heroExperience?: number;
    livingHeroIds?: string[];
    defeatedHeroIds?: string[];
  }) {
    const userId = event.playerId ? this.identities.get(event.playerId) : undefined;
    if (
      !userId ||
      !event.playerId ||
      !event.rewardIdentity ||
      event.amount === undefined ||
      event.heroExperience === undefined ||
      !this.persistence ||
      !this.persistenceQueue
    )
      return;
    const client = this.clients.find((candidate) => candidate.sessionId === event.playerId);
    client?.send('persistence', { status: 'saving', rewardIdentity: event.rewardIdentity });
    const accepted = this.persistenceQueue.enqueue(
      this.roomId,
      `${userId}:${event.rewardIdentity}`,
      async () => {
        try {
          await this.persistence!.applyCombatReward(userId, {
            rewardIdentity: event.rewardIdentity!,
            gold: event.amount!,
            heroExperience: event.heroExperience!,
            livingHeroIds: event.livingHeroIds ?? [],
            defeatedHeroIds: event.defeatedHeroIds ?? [],
          });
          client?.send('persistence', { status: 'saved', rewardIdentity: event.rewardIdentity });
        } catch (error) {
          this.persistenceHealth?.degrade();
          throw error;
        }
      },
    );
    if (!accepted) {
      this.persistenceHealth?.degrade();
      client?.send('persistence', { status: 'degraded', rewardIdentity: event.rewardIdentity });
      this.combat.setAutoHunt(event.playerId, false);
    }
  }

  private assignChanged(target: object, source: object) {
    this.schemaValuesUpdated += assignChanged(target, source);
  }

  private projectCombat() {
    this.state.serverTick = this.combat.tickCount;
    const seenMonsters = new Set<string>();
    for (const snapshot of this.combat.monsterSnapshots()) {
      seenMonsters.add(snapshot.id);
      let schema = this.state.monsters.get(snapshot.id);
      if (!schema) {
        schema = new MonsterSchema();
        this.state.monsters.set(snapshot.id, schema);
      }
      this.assignChanged(schema, {
        ...snapshot,
        targetPlayerId: snapshot.targetPlayerId ?? '',
        targetHeroId: snapshot.targetHeroId ?? '',
      });
    }
    for (const id of this.state.monsters.keys())
      if (!seenMonsters.has(id)) this.state.monsters.delete(id);
    const seenPlayers = new Set<string>();
    for (const snapshot of this.combat.playerSnapshots()) {
      seenPlayers.add(snapshot.playerId);
      let schema = this.state.combatPlayers.get(snapshot.playerId);
      if (!schema) {
        schema = new PlayerCombatSchema();
        this.state.combatPlayers.set(snapshot.playerId, schema);
      }
      this.assignChanged(schema, {
        playerId: snapshot.playerId,
        sessionGold: snapshot.sessionGold,
        autoHuntEnabled: snapshot.autoHuntEnabled,
        autoHuntState: snapshot.autoHuntState,
        focusedMonsterId: snapshot.focusedMonsterId ?? '',
        autoHuntTargetMonsterId: snapshot.autoHuntTargetMonsterId ?? '',
        teamRespawnAtTick: snapshot.teamRespawnAtTick ?? -1,
        floorProgress: snapshot.floorProgress ?? 0,
        guardianEligible: snapshot.guardianEligible ?? false,
        bossDefeated: snapshot.bossDefeated ?? false,
        portalEligibility: snapshot.portalEligibility ?? 'progress-required',
        floorCompleted: snapshot.floorCompleted ?? false,
      });
      while (schema.heroes.length > snapshot.heroes.length) schema.heroes.pop();
      snapshot.heroes.forEach((hero, index) => {
        let heroSchema = schema!.heroes[index];
        if (!heroSchema) {
          heroSchema = new HeroCombatSchema();
          schema!.heroes.push(heroSchema);
        }
        this.assignChanged(heroSchema, {
          id: hero.id,
          definitionId: hero.definitionId,
          role: hero.role,
          level: hero.level,
          experience: hero.experience,
          nextExperience: hero.nextExperience,
          currentHp: hero.currentHp,
          maxHp: hero.maxHp,
          status: hero.status,
          targetMonsterId: hero.targetMonsterId ?? '',
        });
        const signature = statusEffectSignature(hero.statusEffects);
        if (this.effectSignatures.get(heroSchema) !== signature) {
          heroSchema.statusEffects.clear();
          for (const effect of hero.statusEffects) {
            const effectSchema = new StatusEffectSchema();
            assignChanged(effectSchema, effect);
            heroSchema.statusEffects.push(effectSchema);
          }
          this.effectSignatures.set(heroSchema, signature);
          this.effectArraysRebuilt += 1;
        }
      });
    }
    for (const id of this.state.combatPlayers.keys())
      if (!seenPlayers.has(id)) this.state.combatPlayers.delete(id);
    this.assignChanged(this.state.guardian, this.combat.floorGuardianSnapshot());
  }

  private updateMetadata() {
    this.state.playerCount = this.state.players.size;
    this.registry.updatePlayerCount(this.roomId, this.state.playerCount);
    void this.setMetadata({
      roomCode: this.state.roomCode,
      floorId: 'floor_1',
      playerCount: this.state.playerCount,
      maxPlayers: this.maxClients,
    });
  }
}

export function persistentCombatHeroes(bootstrap: PlayerBootstrap): CombatHeroInput[] {
  return bootstrap.activeTeam.slots.flatMap((slot) => {
    const hero = bootstrap.heroes.find((entry) => entry.id === slot.playerHeroId);
    const definition = HERO_DEFINITIONS.find((entry) => entry.id === hero?.definitionId);
    if (!hero || !definition) return [];
    const stats = effectiveHeroStats(definition, hero.totalExperience, hero.stars);
    const role: HeroRole =
      definition.role === 'tank'
        ? 'tank'
        : definition.role === 'healer' || definition.role === 'support'
          ? 'support'
          : 'fighter';
    return [
      {
        id: hero.id,
        definitionId: definition.id,
        role,
        level: hero.level,
        totalExperience: hero.totalExperience,
        maxHp: stats.maxHp,
        attack: stats.attack,
        defense: stats.defense,
        attackRange: stats.attackRange,
        attackCooldownMs: stats.attackCooldownMs,
      },
    ];
  });
}
