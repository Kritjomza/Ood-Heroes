import {
  COMBAT_CONFIG,
  HERO_CONFIG,
  MONSTER_DEFINITIONS,
  SeededRandom,
  WORLD,
  applyExperience,
  calculateAuthoritativeDamage,
  chooseMonsterTarget,
  contributionIsEligible,
  distance,
  effectiveHeroPosition,
  expireStatusEffects,
  findPath,
  isInSafeZone,
  moveCardinal,
  prototypeMap,
  refreshMovementSlow,
  requiredExperienceForNextLevel,
  rewardIdentity,
  safePlayerSpawn,
  tileToWorld,
  worldToTile,
  type Direction,
  type HeroRole,
  type MonsterDefinitionId,
  type MovementSlow,
  type Vector2,
} from '@odd-tower/game-core';
import type {
  AutoHuntState,
  CardinalDirection,
  CombatEvent,
  HeroCombatStatus,
  NetworkHeroCombatState,
  NetworkMonsterState,
  NetworkPlayerCombatState,
} from '@odd-tower/network-protocol';
import type { SimulationPlayer } from './playerSimulation.js';
import { SpatialGrid } from './SpatialGrid.js';
import { StuckTracker, chooseWanderDestination, findMonsterPath } from './MonsterNavigator.js';

type Hero = NetworkHeroCombatState & {
  attack: number;
  defense: number;
  attackRange: number;
  attackCooldownTicks: number;
  nextAttackTick: number;
  reviveStartedTick: number | null;
  effects: MovementSlow[];
};
export type CombatHeroInput = {
  id: string;
  role: HeroRole;
  level: number;
  totalExperience: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackRange: number;
  attackCooldownMs: number;
};
type PlayerCombat = {
  playerId: string;
  heroes: Hero[];
  sessionGold: number;
  autoHuntEnabled: boolean;
  autoHuntState: AutoHuntState;
  focusedMonsterId: string | null;
  autoHuntTargetMonsterId: string | null;
  teamRespawnAtTick: number | null;
  connected: boolean;
  path: Vector2[];
  nextAutoActionTick: number;
  blacklist: Map<string, number>;
};
type Contribution = { damageDealt: number; lastContributionTick: number };
type Monster = NetworkMonsterState & {
  definitionId: MonsterDefinitionId;
  spawn: Vector2;
  nextAttackTick: number;
  nextDecisionTick: number;
  respawnAtTick: number | null;
  path: Vector2[];
  contributions: Map<string, Contribution>;
  chargeWindupEndTick: number | null;
  chargeEndTick: number | null;
  chargeCooldownEndTick: number;
  chargeDirection: CardinalDirection;
  chargeHits: Set<string>;
  nextSpecialDecisionTick: number;
  nextPathRecalculationTick: number;
  nextWanderDecisionTick: number;
  wanderTarget: Vector2 | null;
  pathTargetId: string | null;
  pathFailures: number;
  blacklistedTargetId: string | null;
  blacklistExpiresTick: number;
  stuck: StuckTracker;
};

type HeroSpatial = {
  id: string;
  playerId: string;
  role: HeroRole;
  x: number;
  y: number;
  valid: boolean;
};

const roles: readonly HeroRole[] = ['fighter', 'tank', 'support'];
const basePopulation: readonly MonsterDefinitionId[] = [
  ...Array<MonsterDefinitionId>(13).fill('grumpy-radish'),
  ...Array<MonsterDefinitionId>(4).fill('jumping-sauce-bag'),
  ...Array<MonsterDefinitionId>(7).fill('shoe-biting-dust-ball'),
  ...Array<MonsterDefinitionId>(4).fill('wild-sausage'),
  ...Array<MonsterDefinitionId>(6).fill('lost-pudding'),
];

function spawnCandidates() {
  const values: Vector2[] = [];
  for (let y = 4; y < prototypeMap.height - 4; y += 3)
    for (let x = 4; x < prototypeMap.width - 4; x += 3) {
      const point = tileToWorld({ x, y });
      if (prototypeMap.isWalkable(x, y) && !isInSafeZone(point)) values.push(point);
    }
  return values;
}
const SPAWNS = spawnCandidates();

export class CombatSimulation {
  private tickNumber = 0;
  private eventSequence = 0;
  private readonly random: SeededRandom;
  private readonly players = new Map<string, PlayerCombat>();
  private readonly monsters = new Map<string, Monster>();
  private readonly eventHistory: CombatEvent[] = [];
  private readonly pendingEvents: CombatEvent[] = [];
  private readonly processedRewards = new Set<string>();
  private preparedSharedDeathMonsterId: string | null = null;
  private monsterKills = 0;
  private monsterRespawns = 0;
  private rewardGrants = 0;
  private aiDecisions = 0;
  private pathCalculations = 0;
  private nearbyQueries = 0;
  private wanderDecisions = 0;
  private stuckRecoveries = 0;
  private unreachableFailures = 0;
  private chargeExecutions = 0;
  private healExecutions = 0;
  private slowApplications = 0;
  private heroAttacksResolved = 0;
  private monsterAttacksResolved = 0;
  private eventsCreated = 0;
  private eventsRemoved = 0;
  private readonly heroGrid = new SpatialGrid<HeroSpatial>(COMBAT_CONFIG.spatialCellSize);
  private readonly monsterGrid = new SpatialGrid<Monster>(COMBAT_CONFIG.spatialCellSize);
  private readonly heroIndex = new Map<string, HeroSpatial>();

  constructor(
    private readonly roomId: string,
    seed = hash(roomId),
  ) {
    this.random = new SeededRandom(seed);
    this.ensureMonsterCount(34);
  }

  get tickCount() {
    return this.tickNumber;
  }

  addPlayer(playerId: string, persistentHeroes?: CombatHeroInput[]) {
    if (!this.players.has(playerId)) {
      const heroes: Hero[] = persistentHeroes?.length
        ? persistentHeroes.map((hero) => ({
            id: hero.id,
            role: hero.role,
            level: hero.level,
            experience: hero.totalExperience,
            nextExperience: requiredExperienceForNextLevel(hero.level),
            currentHp: hero.maxHp,
            maxHp: hero.maxHp,
            status: 'alive' as HeroCombatStatus,
            targetMonsterId: null,
            statusEffects: [],
            attack: hero.attack,
            defense: hero.defense,
            attackRange: hero.attackRange,
            attackCooldownTicks: Math.ceil(hero.attackCooldownMs / 50),
            nextAttackTick: 0,
            reviveStartedTick: null,
            effects: [],
          }))
        : roles.map((role) => {
            const definition = HERO_CONFIG[role];
            return {
              id: `${playerId}:${role}`,
              role,
              level: 1,
              experience: 0,
              nextExperience: requiredExperienceForNextLevel(1),
              currentHp: definition.maxHp,
              maxHp: definition.maxHp,
              status: 'alive' as HeroCombatStatus,
              targetMonsterId: null,
              statusEffects: [],
              attack: definition.attack,
              defense: definition.defense,
              attackRange: definition.attackRange,
              attackCooldownTicks: Math.ceil(definition.attackCooldownMs / 50),
              nextAttackTick: 0,
              reviveStartedTick: null,
              effects: [],
            };
          });
      this.players.set(playerId, {
        playerId,
        heroes,
        sessionGold: 0,
        autoHuntEnabled: false,
        autoHuntState: 'disabled',
        focusedMonsterId: null,
        autoHuntTargetMonsterId: null,
        teamRespawnAtTick: null,
        connected: true,
        path: [],
        nextAutoActionTick: 0,
        blacklist: new Map(),
      });
    }
    this.ensureMonsterCount(Math.min(50, 34 + Math.max(0, this.players.size - 1) * 2));
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    for (const monster of this.monsters.values()) monster.contributions.delete(playerId);
  }

  disconnectPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;
    this.disableAuto(player);
    player.focusedMonsterId = null;
    for (const hero of player.heroes) hero.targetMonsterId = null;
  }

  reconnectPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = true;
    this.disableAuto(player);
  }

  focusTarget(playerId: string, monsterId: string | null) {
    const player = this.players.get(playerId);
    if (!player) return false;
    if (monsterId !== null) {
      const monster = this.monsters.get(monsterId);
      if (!monster || monster.status !== 'alive') return false;
    }
    player.focusedMonsterId = monsterId;
    return true;
  }

  setAutoHunt(playerId: string, enabled: boolean) {
    const player = this.players.get(playerId);
    if (!player || player.teamRespawnAtTick !== null || !player.connected) return false;
    player.autoHuntEnabled = enabled;
    player.autoHuntState = enabled ? 'acquiring-target' : 'disabled';
    player.autoHuntTargetMonsterId = null;
    player.path = [];
    return true;
  }

  manualMovement(playerId: string, direction: CardinalDirection) {
    if (direction === 'none') return;
    const player = this.players.get(playerId);
    if (player) this.disableAuto(player);
  }

  forceLowHp(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return false;
    for (const hero of player.heroes) {
      hero.status = 'alive';
      hero.currentHp = Math.max(1, Math.floor(hero.maxHp * 0.2));
    }
    return true;
  }

  forceTeamWipe(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return false;
    for (const hero of player.heroes)
      this.applyHeroDamage(playerId, hero.id, hero.maxHp, 'test-hazard');
    return true;
  }

  setupWallNavigation(playerId: string) {
    const monster = this.monsters.values().next().value as Monster | undefined;
    if (!monster || !this.players.has(playerId)) return null;
    Object.assign(monster, {
      x: 528,
      y: 528,
      spawn: { x: 528, y: 528 },
      targetPlayerId: playerId,
      targetHeroId: `${playerId}:fighter`,
      nextDecisionTick: this.tickNumber,
      path: [],
      pathTargetId: null,
      wanderTarget: null,
      blacklistedTargetId: null,
      blacklistExpiresTick: 0,
    });
    monster.stuck.reset(monster, this.tickNumber);
    return monster.id;
  }

  setupTapTarget(playerId: string) {
    const monster = this.monsters.values().next().value as Monster | undefined;
    if (!monster || !this.players.has(playerId)) return null;
    Object.assign(monster, {
      x: 1120,
      y: 1024,
      spawn: { x: 1120, y: 1024 },
      targetPlayerId: null,
      targetHeroId: null,
      nextDecisionTick: this.tickNumber + 200,
      path: [],
      pathTargetId: null,
      wanderTarget: null,
    });
    return monster.id;
  }

  prepareSharedMonsterDeath() {
    const monster = this.monsters.values().next().value as Monster | undefined;
    if (!monster) return null;
    const contribution = Math.max(1, Math.ceil(monster.maxHp * 0.1));
    for (const playerId of this.players.keys())
      this.applyMonsterDamage(playerId, monster.id, contribution);
    monster.currentHp = 1;
    this.preparedSharedDeathMonsterId = monster.id;
    return monster.id;
  }

  finishSharedMonsterDeath(playerId: string) {
    const monster = this.preparedSharedDeathMonsterId
      ? this.monsters.get(this.preparedSharedDeathMonsterId)
      : undefined;
    this.preparedSharedDeathMonsterId = null;
    return monster?.status === 'alive'
      ? this.applyMonsterDamage(playerId, monster.id, Math.ceil(monster.currentHp)) > 0
      : false;
  }

  applyHeroDamage(playerId: string, heroId: string, amount: number, sourceId: string) {
    const hero = this.players.get(playerId)?.heroes.find((candidate) => candidate.id === heroId);
    if (!hero || hero.status !== 'alive' || !Number.isFinite(amount) || amount <= 0) return 0;
    const applied = Math.min(hero.currentHp, Math.floor(amount));
    hero.currentHp -= applied;
    this.emit('damage', { sourceId, targetId: hero.id, amount: applied });
    if (hero.currentHp === 0) {
      hero.status = 'defeated';
      hero.targetMonsterId = null;
      this.emit('hero-defeated', { sourceId, targetId: hero.id });
    }
    return applied;
  }

  applyMonsterDamage(playerId: string | null, monsterId: string, amount: number) {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.status !== 'alive' || !Number.isFinite(amount) || amount <= 0) return 0;
    const applied = Math.min(monster.currentHp, Math.floor(amount));
    monster.currentHp -= applied;
    if (playerId) {
      const entry = monster.contributions.get(playerId) ?? {
        damageDealt: 0,
        lastContributionTick: this.tickNumber,
      };
      entry.damageDealt += applied;
      entry.lastContributionTick = this.tickNumber;
      monster.contributions.set(playerId, entry);
    }
    if (monster.currentHp <= 0) this.defeatMonster(monster);
    return applied;
  }

  tick(simulations: Map<string, SimulationPlayer>) {
    this.tickNumber += 1;
    this.processWipes(simulations);
    for (const [playerId, player] of this.players) {
      const simulation = simulations.get(playerId);
      if (!simulation) continue;
      player.connected = simulation.state.connected;
      this.expireEffects(player);
      this.updateAutoHunt(player, simulation);
    }
    this.rebuildSpatialIndexes(simulations);
    this.updateMonsters(simulations);
    this.resolveHeroAttacks(simulations);
    this.resolveSafeZoneAndRespawns(simulations);
    this.processMonsterRespawns();
  }

  monsterSnapshots(): NetworkMonsterState[] {
    return [...this.monsters.values()].map((monster) => this.monsterSnapshot(monster));
  }

  playerSnapshot(playerId: string): NetworkPlayerCombatState | undefined {
    const player = this.players.get(playerId);
    if (!player) return undefined;
    return {
      playerId,
      heroes: player.heroes.map((hero) => ({
        id: hero.id,
        role: hero.role,
        level: hero.level,
        experience: hero.experience,
        nextExperience: hero.nextExperience,
        currentHp: hero.currentHp,
        maxHp: hero.maxHp,
        status: hero.status,
        targetMonsterId: hero.targetMonsterId,
        statusEffects: hero.effects.map((effect) => ({
          type: effect.type,
          magnitude: effect.magnitude,
          expirationTick: effect.expirationTick,
        })),
      })),
      sessionGold: player.sessionGold,
      autoHuntEnabled: player.autoHuntEnabled,
      autoHuntState: player.autoHuntState,
      focusedMonsterId: player.focusedMonsterId,
      autoHuntTargetMonsterId: player.autoHuntTargetMonsterId,
      teamRespawnAtTick: player.teamRespawnAtTick,
    };
  }

  playerSnapshots() {
    return [...this.players.keys()].map((id) => this.playerSnapshot(id)!);
  }
  events() {
    return this.eventHistory.map((event) => ({ ...event }));
  }
  drainEvents() {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }
  diagnostics() {
    return {
      ticks: this.tickNumber,
      monsterCount: this.monsters.size,
      monsterKills: this.monsterKills,
      monsterRespawns: this.monsterRespawns,
      rewardGrants: this.rewardGrants,
      retainedEvents: this.eventHistory.length,
      pendingEvents: this.pendingEvents.length,
      processedRewardKeys: this.processedRewards.size,
      aiDecisions: this.aiDecisions,
      pathCalculations: this.pathCalculations,
      nearbyQueries: this.nearbyQueries,
      wanderDecisions: this.wanderDecisions,
      stuckRecoveries: this.stuckRecoveries,
      unreachableFailures: this.unreachableFailures,
      chargeExecutions: this.chargeExecutions,
      healExecutions: this.healExecutions,
      slowApplications: this.slowApplications,
      heroAttacksResolved: this.heroAttacksResolved,
      monsterAttacksResolved: this.monsterAttacksResolved,
      eventsCreated: this.eventsCreated,
      eventsRemoved: this.eventsRemoved,
      activeMonsters: [...this.monsters.values()].filter((monster) => monster.status === 'alive')
        .length,
      contributionEntries: [...this.monsters.values()].reduce(
        (sum, monster) => sum + monster.contributions.size,
        0,
      ),
      pathCacheEntries: [...this.monsters.values()].reduce(
        (sum, monster) => sum + monster.path.length,
        0,
      ),
      spatialEntries: this.heroGrid.size + this.monsterGrid.size,
    };
  }

  dispose() {
    this.players.clear();
    this.monsters.clear();
    this.eventHistory.length = 0;
    this.pendingEvents.length = 0;
    this.processedRewards.clear();
    this.preparedSharedDeathMonsterId = null;
    this.heroGrid.clear();
    this.monsterGrid.clear();
    this.heroIndex.clear();
  }

  private ensureMonsterCount(count: number) {
    while (this.monsters.size < count) {
      const index = this.monsters.size;
      const definitionId = basePopulation[index] ?? basePopulation[index % basePopulation.length]!;
      const definition = MONSTER_DEFINITIONS[definitionId];
      const spawn = SPAWNS[index % SPAWNS.length]!;
      const id = `spawn-${index + 1}`;
      this.monsters.set(id, {
        id,
        definitionId,
        name: definition.name,
        level: definition.baseLevel,
        x: spawn.x,
        y: spawn.y,
        direction: 'none',
        currentHp: definition.baseMaxHp,
        maxHp: definition.baseMaxHp,
        status: 'alive',
        aiState: 'idle',
        targetPlayerId: null,
        targetHeroId: null,
        spawnGeneration: 1,
        spawn: { ...spawn },
        nextAttackTick: 0,
        nextDecisionTick: index % COMBAT_CONFIG.aiDecisionTicks,
        respawnAtTick: null,
        path: [],
        contributions: new Map(),
        chargeWindupEndTick: null,
        chargeEndTick: null,
        chargeCooldownEndTick: 0,
        chargeDirection: 'none',
        chargeHits: new Set(),
        nextSpecialDecisionTick:
          COMBAT_CONFIG.puddingHealTicks + (index % COMBAT_CONFIG.aiDecisionTicks),
        nextPathRecalculationTick: index % COMBAT_CONFIG.pathRecalculationTicks,
        nextWanderDecisionTick: index % COMBAT_CONFIG.wanderDecisionTicks,
        wanderTarget: null,
        pathTargetId: null,
        pathFailures: 0,
        blacklistedTargetId: null,
        blacklistExpiresTick: 0,
        stuck: new StuckTracker(COMBAT_CONFIG.progressThreshold, COMBAT_CONFIG.stuckDurationTicks),
      });
    }
  }

  private updateAutoHunt(player: PlayerCombat, simulation: SimulationPlayer) {
    if (!player.autoHuntEnabled || !player.connected || player.teamRespawnAtTick !== null) return;
    for (const [id, expires] of player.blacklist)
      if (expires <= this.tickNumber) player.blacklist.delete(id);
    const living = player.heroes.filter((hero) => hero.status === 'alive');
    const hpRatio =
      living.reduce((sum, hero) => sum + hero.currentHp, 0) /
      Math.max(
        1,
        living.reduce((sum, hero) => sum + hero.maxHp, 0),
      );
    const anchor = { x: simulation.state.x, y: simulation.state.y };
    if (hpRatio < WORLD.autoRetreat || player.autoHuntState === 'retreating') {
      player.autoHuntState = isInSafeZone(anchor) ? 'recovering' : 'retreating';
      player.autoHuntTargetMonsterId = null;
      this.moveAnchorToward(simulation, WORLD.safeCenter, player);
      return;
    }
    if (player.autoHuntState === 'recovering') {
      if (hpRatio < WORLD.autoRecover) return;
      player.autoHuntState = 'acquiring-target';
    }
    let target = player.autoHuntTargetMonsterId
      ? this.monsters.get(player.autoHuntTargetMonsterId)
      : undefined;
    if (!target || target.status !== 'alive') {
      target = [...this.monsters.values()]
        .filter((monster) => monster.status === 'alive' && !player.blacklist.has(monster.id))
        .sort((a, b) => distance(anchor, a) - distance(anchor, b) || a.id.localeCompare(b.id))[0];
      player.autoHuntTargetMonsterId = target?.id ?? null;
      player.path = [];
      if (!target) {
        player.autoHuntState = 'waiting';
        return;
      }
    }
    const engagement = Math.max(
      ...player.heroes.filter((hero) => hero.status === 'alive').map((hero) => hero.attackRange),
    );
    if (distance(anchor, target) <= engagement) {
      player.autoHuntState = 'engaging';
      return;
    }
    player.autoHuntState = 'navigating';
    if (!this.moveAnchorToward(simulation, target, player)) {
      player.blacklist.set(target.id, this.tickNumber + COMBAT_CONFIG.autoHuntBlacklistTicks);
      while (player.blacklist.size > COMBAT_CONFIG.autoHuntBlacklistLimit)
        player.blacklist.delete(player.blacklist.keys().next().value!);
      player.autoHuntTargetMonsterId = null;
      player.autoHuntState = 'waiting';
    }
  }

  private moveAnchorToward(simulation: SimulationPlayer, goal: Vector2, player: PlayerCombat) {
    const anchor = { x: simulation.state.x, y: simulation.state.y };
    if (!player.path.length || this.tickNumber >= player.nextAutoActionTick) {
      const path = findPath(prototypeMap, worldToTile(anchor), worldToTile(goal));
      if (!path) return false;
      player.path = path.slice(1).map(tileToWorld);
      player.nextAutoActionTick = this.tickNumber + COMBAT_CONFIG.pathRecalculationTicks;
    }
    while (player.path[0] && distance(anchor, player.path[0]) < 8) player.path.shift();
    const waypoint = player.path[0] ?? goal;
    const direction = cardinalToward(anchor, waypoint);
    const slowed = player.heroes.some((hero) => hero.effects.length) ? 0.8 : 1;
    const next = moveCardinal(anchor, direction, 50, 120 * slowed, prototypeMap, 15);
    simulation.state.x = next.x;
    simulation.state.y = next.y;
    simulation.state.direction = direction;
    simulation.state.moving = true;
    return next.x !== anchor.x || next.y !== anchor.y;
  }

  private updateMonsters(simulations: Map<string, SimulationPlayer>) {
    for (const monster of this.monsters.values()) {
      if (monster.status !== 'alive') continue;
      const definition = MONSTER_DEFINITIONS[monster.definitionId];
      const decisionDue = this.tickNumber >= monster.nextDecisionTick;
      if (decisionDue) {
        monster.nextDecisionTick = this.tickNumber + COMBAT_CONFIG.aiDecisionTicks;
        this.aiDecisions += 1;
      }
      if (
        definition.special === 'heal' &&
        decisionDue &&
        this.tickNumber >= monster.nextSpecialDecisionTick
      ) {
        monster.nextSpecialDecisionTick = this.tickNumber + COMBAT_CONFIG.puddingHealTicks;
        this.nearbyQueries += 1;
        const ally = this.monsterGrid
          .queryRadius(monster, COMBAT_CONFIG.puddingHealRange)
          .filter((candidate) => candidate.currentHp < candidate.maxHp)
          .sort(
            (a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp || a.id.localeCompare(b.id),
          )[0];
        if (ally) {
          const amount = Math.min(COMBAT_CONFIG.puddingHealAmount, ally.maxHp - ally.currentHp);
          ally.currentHp += amount;
          monster.aiState = 'healing';
          this.healExecutions += 1;
          this.emit('monster-heal', { sourceId: monster.id, targetId: ally.id, amount });
          continue;
        }
      }
      let selected = monster.targetHeroId
        ? this.toTargetCandidate(monster, this.heroIndex.get(monster.targetHeroId))
        : undefined;
      if (decisionDue) {
        const candidates = this.heroCandidates(monster, simulations, definition.aggroRadius).filter(
          (candidate) =>
            !(
              monster.blacklistedTargetId === candidate.id &&
              monster.blacklistExpiresTick > this.tickNumber
            ),
        );
        selected = chooseMonsterTarget(candidates);
        monster.targetPlayerId = selected?.playerId ?? null;
        monster.targetHeroId = selected?.id ?? null;
        if (
          monster.blacklistedTargetId !== null &&
          monster.blacklistExpiresTick <= this.tickNumber
        ) {
          monster.blacklistedTargetId = null;
          monster.blacklistExpiresTick = 0;
        }
      }
      if (!selected || distance(monster, monster.spawn) > definition.leashRadius) {
        monster.targetPlayerId = null;
        monster.targetHeroId = null;
        monster.pathTargetId = null;
        if (distance(monster, monster.spawn) > 5) {
          monster.aiState = 'returning';
          this.moveMonster(monster, monster.spawn, definition.moveSpeed, 'spawn');
        } else {
          if (decisionDue && this.tickNumber >= monster.nextWanderDecisionTick) {
            monster.nextWanderDecisionTick =
              this.tickNumber +
              COMBAT_CONFIG.wanderDecisionTicks +
              Math.floor(this.random.next() * (COMBAT_CONFIG.wanderDecisionTicks * 2 + 1));
            monster.wanderTarget = chooseWanderDestination(
              monster.spawn,
              this.random,
              COMBAT_CONFIG.wanderRadius,
            );
            this.wanderDecisions += 1;
          }
          if (monster.wanderTarget) {
            monster.aiState = 'wandering';
            this.moveMonster(monster, monster.wanderTarget, definition.moveSpeed * 0.55, 'wander');
            if (distance(monster, monster.wanderTarget) < 8) {
              monster.wanderTarget = null;
              monster.path = [];
              monster.aiState = 'idle';
            }
          } else monster.aiState = 'idle';
        }
        monster.currentHp = Math.min(
          monster.maxHp,
          monster.currentHp + monster.maxHp * COMBAT_CONFIG.monsterReturnHealPerTick,
        );
        continue;
      }
      monster.wanderTarget = null;
      monster.targetPlayerId = selected.playerId;
      monster.targetHeroId = selected.id;
      if (definition.special === 'charge') {
        if (monster.aiState === 'windup' && monster.chargeWindupEndTick !== null) {
          if (this.tickNumber < monster.chargeWindupEndTick) continue;
          monster.aiState = 'charging';
          monster.chargeEndTick = this.tickNumber + 8;
          monster.chargeHits.clear();
        }
        if (monster.aiState === 'charging') {
          const before = { x: monster.x, y: monster.y };
          const next = moveCardinal(
            monster,
            monster.chargeDirection,
            50,
            COMBAT_CONFIG.chargeSpeed,
            prototypeMap,
            14,
          );
          if (!isInSafeZone(next)) {
            monster.x = next.x;
            monster.y = next.y;
            monster.direction = monster.chargeDirection;
          }
          for (const candidate of this.heroCandidates(monster, simulations, 34))
            if (candidate.valid && !monster.chargeHits.has(candidate.id)) {
              monster.chargeHits.add(candidate.id);
              const hero = this.players
                .get(candidate.playerId)!
                .heroes.find((value) => value.id === candidate.id)!;
              const damage = calculateAuthoritativeDamage(
                definition.attack * 1.5,
                hero.defense,
                () => this.random.next(),
              );
              this.applyHeroDamage(candidate.playerId, candidate.id, damage, monster.id);
              this.chargeExecutions += 1;
              this.emit('charge-impact', {
                sourceId: monster.id,
                targetId: candidate.id,
                amount: damage,
              });
            }
          if (
            (monster.chargeEndTick !== null && this.tickNumber >= monster.chargeEndTick) ||
            (next.x === before.x && next.y === before.y)
          ) {
            monster.aiState = 'chasing';
            monster.chargeEndTick = null;
            monster.chargeWindupEndTick = null;
            monster.chargeCooldownEndTick = this.tickNumber + COMBAT_CONFIG.chargeCooldownTicks;
          }
          continue;
        }
        if (
          selected.distance > definition.attackRange &&
          decisionDue &&
          this.tickNumber >= monster.chargeCooldownEndTick
        ) {
          monster.aiState = 'windup';
          monster.chargeDirection = cardinalToward(monster, selected.position);
          monster.direction = monster.chargeDirection;
          monster.chargeWindupEndTick = this.tickNumber + COMBAT_CONFIG.chargeWindupTicks;
          this.emit('charge-warning', { sourceId: monster.id, targetId: selected.id });
          continue;
        }
      }
      if (selected.distance > definition.attackRange) {
        monster.aiState = 'chasing';
        this.moveMonster(monster, selected.position, definition.moveSpeed, selected.id);
      } else {
        monster.aiState = 'attacking';
        if (this.tickNumber >= monster.nextAttackTick) {
          monster.nextAttackTick = this.tickNumber + definition.attackCooldownTicks;
          const player = this.players.get(selected.playerId)!;
          const hero = player.heroes.find((value) => value.id === selected.id)!;
          const damage = calculateAuthoritativeDamage(definition.attack, hero.defense, () =>
            this.random.next(),
          );
          this.applyHeroDamage(player.playerId, hero.id, damage, monster.id);
          this.monsterAttacksResolved += 1;
          this.emit('monster-attack', { sourceId: monster.id, targetId: hero.id, amount: damage });
          if (definition.special === 'slow' && hero.status === 'alive') {
            hero.effects = refreshMovementSlow(
              hero.effects,
              monster.id,
              this.tickNumber,
              COMBAT_CONFIG.slowDurationTicks,
            );
            this.slowApplications += 1;
            this.emit('slow-applied', { sourceId: monster.id, targetId: hero.id });
          }
        }
      }
    }
  }

  private resolveHeroAttacks(simulations: Map<string, SimulationPlayer>) {
    for (const [playerId, player] of this.players) {
      const simulation = simulations.get(playerId);
      if (!simulation || !player.connected || player.teamRespawnAtTick !== null) continue;
      const anchor = { x: simulation.state.x, y: simulation.state.y };
      if (
        isInSafeZone(anchor) ||
        player.autoHuntState === 'retreating' ||
        player.autoHuntState === 'recovering'
      )
        continue;
      for (const hero of player.heroes) {
        if (hero.status !== 'alive' || this.tickNumber < hero.nextAttackTick) continue;
        const position = effectiveHeroPosition(
          anchor,
          directionFor(simulation.state.direction),
          hero.role,
        );
        const preferred =
          player.focusedMonsterId ?? hero.targetMonsterId ?? player.autoHuntTargetMonsterId;
        this.nearbyQueries += 1;
        const valid = this.monsterGrid.queryRadius(position, hero.attackRange);
        const target =
          valid.find(
            (monster) =>
              monster.id === preferred && distance(position, monster) <= hero.attackRange,
          ) ??
          valid
            .filter((monster) => distance(position, monster) <= hero.attackRange)
            .sort(
              (a, b) => distance(position, a) - distance(position, b) || a.id.localeCompare(b.id),
            )[0];
        if (!target) continue;
        hero.targetMonsterId = target.id;
        hero.nextAttackTick = this.tickNumber + hero.attackCooldownTicks;
        const definition = MONSTER_DEFINITIONS[target.definitionId];
        const damage = Math.min(
          target.currentHp,
          calculateAuthoritativeDamage(hero.attack, definition.defense, () => this.random.next()),
        );
        if (damage <= 0) continue;
        this.applyMonsterDamage(playerId, target.id, damage);
        this.heroAttacksResolved += 1;
        this.emit('hero-attack', { sourceId: hero.id, targetId: target.id, amount: damage });
        this.emit('damage', { sourceId: hero.id, targetId: target.id, amount: damage });
      }
    }
  }

  private defeatMonster(monster: Monster) {
    if (monster.status !== 'alive') return;
    monster.currentHp = 0;
    monster.status = 'defeated';
    monster.aiState = 'defeated';
    this.monsterKills += 1;
    monster.respawnAtTick =
      this.tickNumber + MONSTER_DEFINITIONS[monster.definitionId].respawnTicks;
    monster.targetPlayerId = null;
    monster.targetHeroId = null;
    monster.path = [];
    monster.pathTargetId = null;
    monster.wanderTarget = null;
    this.monsterGrid.remove(monster.id);
    this.emit('monster-defeated', { targetId: monster.id });
    const identity = rewardIdentity(this.roomId, monster.id, monster.spawnGeneration);
    for (const [playerId, contribution] of monster.contributions) {
      const key = `${identity}:${playerId}`;
      const player = this.players.get(playerId);
      if (
        !player ||
        this.processedRewards.has(key) ||
        !contributionIsEligible(contribution, monster.maxHp, this.tickNumber)
      )
        continue;
      this.processedRewards.add(key);
      const definition = MONSTER_DEFINITIONS[monster.definitionId];
      player.sessionGold += definition.goldReward;
      this.rewardGrants += 1;
      for (const hero of player.heroes) {
        const before = hero.level;
        const reward =
          hero.status === 'alive'
            ? definition.experienceReward
            : Math.floor(definition.experienceReward / 2);
        const progress = applyExperience(hero, reward);
        Object.assign(hero, progress, {
          nextExperience: requiredExperienceForNextLevel(progress.level),
        });
        if (hero.level > before)
          this.emit('hero-level-up', { playerId, targetId: hero.id, amount: hero.level });
      }
      this.emit('reward-granted', {
        playerId,
        sourceId: monster.id,
        amount: definition.goldReward,
        rewardIdentity: identity,
        heroExperience: definition.experienceReward,
        livingHeroIds: player.heroes
          .filter((hero) => hero.status === 'alive')
          .map((hero) => hero.id),
        defeatedHeroIds: player.heroes
          .filter((hero) => hero.status !== 'alive')
          .map((hero) => hero.id),
      });
    }
  }

  private resolveSafeZoneAndRespawns(simulations: Map<string, SimulationPlayer>) {
    for (const [playerId, player] of this.players) {
      const simulation = simulations.get(playerId);
      if (!simulation || player.teamRespawnAtTick !== null) continue;
      const safe = isInSafeZone({ x: simulation.state.x, y: simulation.state.y });
      for (const hero of player.heroes) {
        if (hero.status === 'alive' && safe)
          hero.currentHp = Math.min(
            hero.maxHp,
            hero.currentHp + hero.maxHp * COMBAT_CONFIG.safeHealPerTick,
          );
        if (
          hero.status === 'defeated' &&
          safe &&
          player.heroes.some((other) => other.status === 'alive')
        ) {
          hero.status = 'reviving';
          hero.reviveStartedTick ??= this.tickNumber;
        } else if (hero.status === 'reviving' && !safe) {
          hero.status = 'defeated';
          hero.reviveStartedTick = null;
        } else if (
          hero.status === 'reviving' &&
          hero.reviveStartedTick !== null &&
          this.tickNumber - hero.reviveStartedTick >= COMBAT_CONFIG.individualReviveTicks
        ) {
          hero.status = 'alive';
          hero.currentHp = Math.ceil(hero.maxHp * 0.5);
          hero.reviveStartedTick = null;
          this.emit('hero-revived', { playerId, targetId: hero.id });
        }
      }
    }
  }

  private processWipes(simulations: Map<string, SimulationPlayer>) {
    for (const [playerId, player] of this.players) {
      const simulation = simulations.get(playerId);
      if (!simulation) continue;
      if (
        player.teamRespawnAtTick === null &&
        player.heroes.every((hero) => hero.status !== 'alive')
      ) {
        player.teamRespawnAtTick = this.tickNumber + COMBAT_CONFIG.teamRespawnTicks;
        player.focusedMonsterId = null;
        this.disableAuto(player);
        this.emit('team-wipe', { playerId });
      }
      if (player.teamRespawnAtTick !== null && this.tickNumber >= player.teamRespawnAtTick) {
        const spawn = safePlayerSpawn(0);
        Object.assign(simulation.state, {
          x: spawn.x,
          y: spawn.y,
          direction: 'none',
          moving: false,
        });
        for (const hero of player.heroes) {
          hero.currentHp = hero.maxHp;
          hero.status = 'alive';
          hero.effects = [];
          hero.statusEffects = [];
          hero.targetMonsterId = null;
          hero.reviveStartedTick = null;
        }
        player.teamRespawnAtTick = null;
        this.emit('team-respawn', { playerId });
      }
    }
  }

  private processMonsterRespawns() {
    for (const monster of this.monsters.values()) {
      if (monster.respawnAtTick === null || this.tickNumber < monster.respawnAtTick) continue;
      const expiredIdentity = rewardIdentity(this.roomId, monster.id, monster.spawnGeneration);
      for (const key of this.processedRewards)
        if (key.startsWith(`${expiredIdentity}:`)) this.processedRewards.delete(key);
      monster.status = 'alive';
      monster.aiState = 'idle';
      monster.currentHp = monster.maxHp;
      monster.x = monster.spawn.x;
      monster.y = monster.spawn.y;
      monster.direction = 'none';
      monster.spawnGeneration += 1;
      monster.respawnAtTick = null;
      monster.contributions.clear();
      monster.path = [];
      monster.pathTargetId = null;
      monster.pathFailures = 0;
      monster.blacklistedTargetId = null;
      monster.blacklistExpiresTick = 0;
      monster.wanderTarget = null;
      monster.stuck.reset(monster, this.tickNumber);
      this.monsterRespawns += 1;
      monster.chargeWindupEndTick = null;
      monster.chargeEndTick = null;
      monster.chargeHits.clear();
    }
  }

  private expireEffects(player: PlayerCombat) {
    for (const hero of player.heroes) {
      hero.effects = expireStatusEffects(hero.effects, this.tickNumber);
      hero.statusEffects = hero.effects.map((effect) => ({
        type: effect.type,
        magnitude: effect.magnitude,
        expirationTick: effect.expirationTick,
      }));
    }
  }

  private rebuildSpatialIndexes(simulations: Map<string, SimulationPlayer>) {
    this.heroGrid.clear();
    this.monsterGrid.clear();
    this.heroIndex.clear();
    for (const monster of this.monsters.values())
      if (monster.status === 'alive') this.monsterGrid.upsert(monster);
    for (const [playerId, player] of this.players) {
      const simulation = simulations.get(playerId);
      if (!simulation || !player.connected || !simulation.state.connected) continue;
      const anchor = { x: simulation.state.x, y: simulation.state.y };
      for (const hero of player.heroes) {
        const position = effectiveHeroPosition(
          anchor,
          directionFor(simulation.state.direction),
          hero.role,
        );
        const item: HeroSpatial = {
          id: hero.id,
          playerId,
          role: hero.role,
          x: position.x,
          y: position.y,
          valid:
            player.teamRespawnAtTick === null && hero.status === 'alive' && !isInSafeZone(position),
        };
        this.heroGrid.upsert(item);
        this.heroIndex.set(item.id, item);
      }
    }
  }

  private heroCandidates(
    monster: Monster,
    _simulations: Map<string, SimulationPlayer>,
    radius: number,
  ) {
    this.nearbyQueries += 1;
    return this.heroGrid.queryRadius(monster, radius).map((hero) => ({
      id: hero.id,
      playerId: hero.playerId,
      role: hero.role,
      distance: Math.hypot(hero.x - monster.x, hero.y - monster.y),
      valid: hero.valid,
      position: { x: hero.x, y: hero.y },
    }));
  }

  private toTargetCandidate(monster: Monster, hero: HeroSpatial | undefined) {
    if (!hero?.valid) return undefined;
    const separation = Math.hypot(hero.x - monster.x, hero.y - monster.y);
    return {
      id: hero.id,
      playerId: hero.playerId,
      role: hero.role,
      distance: separation,
      valid: true,
      position: { x: hero.x, y: hero.y },
    };
  }

  private moveMonster(monster: Monster, goal: Vector2, speed: number, targetId: string) {
    if (monster.pathTargetId !== targetId) {
      monster.path = [];
      monster.pathTargetId = targetId;
      monster.pathFailures = 0;
      monster.stuck.reset(monster, this.tickNumber);
    }
    while (
      monster.path[0] &&
      distance(monster, monster.path[0]) < COMBAT_CONFIG.waypointReachDistance
    )
      monster.path.shift();
    const waypoint = monster.path[0] ?? goal;
    const direction = cardinalToward(monster, waypoint);
    const before = { x: monster.x, y: monster.y };
    const next = moveCardinal(monster, direction, 50, speed, prototypeMap, 14);
    if (!isInSafeZone(next)) {
      monster.x = next.x;
      monster.y = next.y;
      monster.direction = direction;
      this.monsterGrid.upsert(monster);
    }
    const stuck = monster.stuck.observe(monster, this.tickNumber, true);
    if (stuck && this.tickNumber >= monster.nextPathRecalculationTick) {
      monster.nextPathRecalculationTick = this.tickNumber + COMBAT_CONFIG.pathRecalculationTicks;
      this.pathCalculations += 1;
      const path = findMonsterPath(
        monster,
        goal,
        monster.spawn,
        MONSTER_DEFINITIONS[monster.definitionId].leashRadius,
      );
      if (path && path.length > 1) {
        monster.path = path.slice(1);
        monster.pathFailures = 0;
        monster.stuck.reset(monster, this.tickNumber);
        this.stuckRecoveries += 1;
      } else {
        monster.path = [];
        monster.pathFailures += 1;
        this.unreachableFailures += 1;
        monster.stuck.reset(monster, this.tickNumber);
        if (monster.pathFailures >= COMBAT_CONFIG.maximumPathFailures) {
          monster.blacklistedTargetId = targetId;
          monster.blacklistExpiresTick = this.tickNumber + COMBAT_CONFIG.autoHuntBlacklistTicks;
          monster.targetPlayerId = null;
          monster.targetHeroId = null;
          monster.pathTargetId = null;
          monster.pathFailures = 0;
        }
      }
    } else if (next.x !== before.x || next.y !== before.y) {
      monster.stuck.observe(monster, this.tickNumber, true);
    }
  }

  private disableAuto(player: PlayerCombat) {
    player.autoHuntEnabled = false;
    player.autoHuntState = 'disabled';
    player.autoHuntTargetMonsterId = null;
    player.path = [];
  }

  private monsterSnapshot(monster: Monster): NetworkMonsterState {
    return {
      id: monster.id,
      definitionId: monster.definitionId,
      name: monster.name,
      level: monster.level,
      x: monster.x,
      y: monster.y,
      direction: monster.direction,
      currentHp: Math.max(0, Math.round(monster.currentHp)),
      maxHp: monster.maxHp,
      status: monster.status,
      aiState: monster.aiState,
      targetPlayerId: monster.targetPlayerId,
      targetHeroId: monster.targetHeroId,
      spawnGeneration: monster.spawnGeneration,
    };
  }

  private emit(type: CombatEvent['type'], values: Omit<CombatEvent, 'id' | 'tick' | 'type'> = {}) {
    const event: CombatEvent = {
      id: `${this.roomId}-${this.tickNumber}-${++this.eventSequence}`,
      tick: this.tickNumber,
      type,
      ...values,
    };
    this.eventsCreated += 1;
    this.eventHistory.push(event);
    this.pendingEvents.push({ ...event });
    if (this.eventHistory.length > COMBAT_CONFIG.eventLimit) {
      this.eventsRemoved += this.eventHistory.length - COMBAT_CONFIG.eventLimit;
      this.eventHistory.splice(0, this.eventHistory.length - COMBAT_CONFIG.eventLimit);
    }
    if (this.pendingEvents.length > COMBAT_CONFIG.eventLimit)
      this.pendingEvents.splice(0, this.pendingEvents.length - COMBAT_CONFIG.eventLimit);
  }
}

function cardinalToward(from: Vector2, to: Vector2): CardinalDirection {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
}
function directionFor(direction: CardinalDirection): Direction {
  return direction === 'none' ? 'down' : direction;
}
function hash(value: string) {
  let state = 2_166_136_261;
  for (const character of value) state = Math.imul(state ^ character.charCodeAt(0), 16_777_619);
  return state >>> 0;
}
