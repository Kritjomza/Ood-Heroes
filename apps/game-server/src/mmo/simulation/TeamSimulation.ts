import {
  chooseHeroTarget,
  chooseMonsterTarget,
  distance,
  effectiveHeroPosition,
  nextAutoHuntState,
  stepCombatKernel,
  type Direction,
  type HeroRole,
  type Vector2,
} from '@odd-tower/game-core';

export type MmoTeamHero = {
  id: string;
  role: HeroRole;
  position: Vector2;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  cooldownTicks: number;
  status: 'alive' | 'defeated';
};

export type MmoTeamMonster = {
  id: string;
  position: Vector2;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  status: 'alive' | 'defeated';
  experienceReward?: number;
  defeatGeneration?: number;
};

export type MmoTeamState = {
  accountId: string;
  leaderId: string;
  facing: Direction;
  heroes: MmoTeamHero[];
  monsters: MmoTeamMonster[];
  targetPreference: string | null;
  autoHuntEnabled: boolean;
  autoHuntState: 'disabled' | 'acquiring-target' | 'navigating' | 'engaging' | 'retreating' | 'recovering' | 'waiting';
  sanctuary: Vector2;
  weaknessUntilTick: number;
  respawnAtTick: number | null;
  worldRevision: number;
};

export type TeamSimulationOptions = {
  respawnDelayTicks?: number;
  weaknessDurationTicks?: number;
  followDistance?: number;
};

const DEFAULT_OPTIONS: Required<TeamSimulationOptions> = {
  respawnDelayTicks: 20,
  weaknessDurationTicks: 60,
  followDistance: 120,
};

export class TeamSimulation {
  readonly options: Required<TeamSimulationOptions>;
  private tickNumber = 0;
  private readonly teams = new Map<string, MmoTeamState>();
  private readonly manualOverrideUntil = new Map<string, number>();

  constructor(options: TeamSimulationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  get currentTick() {
    return this.tickNumber;
  }

  addTeam(accountId: string, heroes: readonly MmoTeamHero[], sanctuary: Vector2 = { x: 0, y: 0 }) {
    if (heroes.length !== 3) throw new Error('three_heroes_required');
    if (new Set(heroes.map((hero) => hero.id)).size !== 3) throw new Error('duplicate_hero_id');
    const leader = (heroes.find((hero) => hero.role === 'fighter') ?? heroes[0])!;
    const state: MmoTeamState = {
      accountId,
      leaderId: leader.id,
      facing: 'down',
      heroes: heroes.map((hero) => ({ ...hero, position: { ...hero.position }, status: hero.status })),
      monsters: [],
      targetPreference: null,
      autoHuntEnabled: false,
      autoHuntState: 'disabled',
      sanctuary: { ...sanctuary },
      weaknessUntilTick: 0,
      respawnAtTick: null,
      worldRevision: 0,
    };
    this.teams.set(accountId, state);
    return cloneState(state);
  }

  getTeam(accountId: string) {
    const state = this.teams.get(accountId);
    return state ? cloneState(state) : undefined;
  }

  removeTeam(accountId: string) {
    this.teams.delete(accountId);
    this.manualOverrideUntil.delete(accountId);
  }

  addMonster(accountId: string, monster: MmoTeamMonster) {
    const state = this.requireTeam(accountId);
    state.monsters.push({ ...monster, position: { ...monster.position }, defeatGeneration: monster.defeatGeneration ?? 0 });
    state.worldRevision += 1;
  }

  setMonsterState(accountId: string, monsterId: string, currentHp: number, status: MmoTeamMonster['status']) {
    const state = this.requireTeam(accountId);
    const monster = state.monsters.find((entry) => entry.id === monsterId);
    if (!monster) return false;
    monster.currentHp = Math.max(0, Math.floor(currentHp));
    monster.status = status;
    state.worldRevision += 1;
    return true;
  }

  movement(accountId: string, direction: Direction | 'idle') {
    const state = this.requireTeam(accountId);
    if (state.respawnAtTick !== null) return;
    if (direction !== 'idle') {
      state.facing = direction;
      const leader = state.heroes.find((hero) => hero.id === state.leaderId)!;
      leader.position = moveOne(leader.position, direction);
      state.autoHuntState = 'disabled';
      this.manualOverrideUntil.set(accountId, this.tickNumber + 1);
    } else {
      this.manualOverrideUntil.delete(accountId);
      this.updateAutoHuntState(state);
    }
    this.followFormation(state);
    state.worldRevision += 1;
  }

  setAutoHunt(accountId: string, enabled: boolean) {
    const state = this.requireTeam(accountId);
    state.autoHuntEnabled = enabled && state.respawnAtTick === null;
    state.autoHuntState = state.autoHuntEnabled ? 'acquiring-target' : 'disabled';
    this.manualOverrideUntil.delete(accountId);
    state.worldRevision += 1;
  }

  setTargetPreference(accountId: string, targetId: string | null) {
    const state = this.requireTeam(accountId);
    state.targetPreference = targetId;
    state.worldRevision += 1;
  }

  applyDamage(accountId: string, heroId: string, damage: number) {
    const state = this.requireTeam(accountId);
    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero || hero.status === 'defeated') return;
    hero.currentHp = Math.max(0, hero.currentHp - Math.max(0, Math.floor(damage)));
    if (hero.currentHp === 0) hero.status = 'defeated';
    state.worldRevision += 1;
  }

  tick() {
    this.tickNumber += 1;
    for (const state of this.teams.values()) {
      if (state.respawnAtTick !== null) {
        if (this.tickNumber >= state.respawnAtTick) this.respawn(state);
        continue;
      }
      const manualInput = this.tickNumber <= (this.manualOverrideUntil.get(state.accountId) ?? -1);
      this.updateAutoHuntState(state, manualInput);
      if (!manualInput && state.autoHuntState === 'navigating') this.autoNavigate(state);
      this.followFormation(state);
      this.resolveAutomaticCombat(state);
      if (state.heroes.every((hero) => hero.status === 'defeated')) {
        state.respawnAtTick = this.tickNumber + this.options.respawnDelayTicks;
        state.autoHuntEnabled = false;
        state.autoHuntState = 'recovering';
        state.worldRevision += 1;
      }
    }
  }

  private updateAutoHuntState(state: MmoTeamState, manualInput = false) {
    const living = state.heroes.filter((hero) => hero.status === 'alive');
    const hpRatio = living.length === 0
      ? 0
      : living.reduce((sum, hero) => sum + hero.currentHp / hero.maxHp, 0) / living.length;
    const leader = state.heroes.find((hero) => hero.id === state.leaderId)!;
    const target = chooseHeroTarget(
      state.monsters.map((monster) => ({
        id: monster.id,
        distance: distance(leader.position, monster.position),
        alive: monster.status === 'alive' && monster.currentHp > 0,
        inSafeZone: false,
      })),
      state.targetPreference,
      null,
    );
    state.autoHuntState = nextAutoHuntState({
      enabled: state.autoHuntEnabled,
      hpRatio,
      allDefeated: living.length === 0,
      manualInput,
      paused: false,
      hasTarget: Boolean(target),
      inSafeZone: distance(leader.position, state.sanctuary) < 24,
      current: state.autoHuntState,
    });
  }

  private autoNavigate(state: MmoTeamState) {
    const leader = state.heroes.find((hero) => hero.id === state.leaderId)!;
    const target = state.monsters
      .filter((monster) => monster.status === 'alive' && monster.currentHp > 0)
      .sort((left, right) => distance(leader.position, left.position) - distance(leader.position, right.position) || left.id.localeCompare(right.id))[0];
    if (!target) return;
    const dx = target.position.x - leader.position.x;
    const dy = target.position.y - leader.position.y;
    const direction: Direction = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    this.movement(state.accountId, direction);
  }

  private followFormation(state: MmoTeamState) {
    const leader = state.heroes.find((hero) => hero.id === state.leaderId)!;
    for (const hero of state.heroes) {
      if (hero.id === leader.id || hero.status !== 'alive') continue;
      const destination = effectiveHeroPosition(leader.position, state.facing, hero.role);
      if (distance(hero.position, destination) > this.options.followDistance)
        hero.position = { ...destination };
    }
  }

  private resolveAutomaticCombat(state: MmoTeamState) {
    const livingHeroes = state.heroes.filter((hero) => hero.status === 'alive');
    const livingMonsters = state.monsters.filter((monster) => monster.status === 'alive' && monster.currentHp > 0);
    if (livingHeroes.length === 0 || livingMonsters.length === 0) return;
    const target = chooseHeroTarget(
      livingMonsters.map((monster) => ({
        id: monster.id,
        distance: distance(state.heroes.find((hero) => hero.id === state.leaderId)!.position, monster.position),
        alive: true,
        inSafeZone: false,
      })),
      state.targetPreference,
      null,
    );
    if (!target) return;
    const monsterIntents = livingMonsters.flatMap((monster) => {
      const monsterTarget = chooseMonsterTarget(
        livingHeroes.map((hero) => ({
          id: hero.id,
          role: hero.role,
          distance: distance(hero.position, monster.position),
          valid: hero.status === 'alive' && hero.currentHp > 0,
        })),
      );
      return monsterTarget
        ? [{ sourceId: monster.id, targetId: monsterTarget.id, kind: 'basic-attack' as const }]
        : [];
    });
    const output = stepCombatKernel({
      tick: this.tickNumber,
      seed: this.tickNumber,
      heroes: livingHeroes.map((hero) => ({
        id: hero.id,
        currentHp: hero.currentHp,
        maxHp: hero.maxHp,
        attack: hero.attack,
        defense: hero.defense,
        cooldownReadyTick: this.tickNumber,
      })),
      monsters: livingMonsters.map((monster) => ({
        id: monster.id,
        currentHp: monster.currentHp,
        maxHp: monster.maxHp,
        attack: monster.attack,
        defense: monster.defense,
        cooldownReadyTick: this.tickNumber,
      })),
      intents: [
        ...livingHeroes.map((hero) => ({ sourceId: hero.id, targetId: target.id, kind: 'basic-attack' as const })),
        ...monsterIntents,
      ],
    });
    for (const next of output.heroes) {
      const hero = state.heroes.find((entry) => entry.id === next.id);
      if (hero) {
        hero.currentHp = next.currentHp;
        if (hero.currentHp === 0) hero.status = 'defeated';
      }
    }
    for (const next of output.monsters) {
      const monster = state.monsters.find((entry) => entry.id === next.id);
      if (monster) {
        monster.currentHp = next.currentHp;
        if (monster.currentHp === 0) {
          monster.status = 'defeated';
          monster.defeatGeneration = (monster.defeatGeneration ?? 0) + 1;
        }
      }
    }
    state.autoHuntState = state.autoHuntEnabled ? 'engaging' : state.autoHuntState;
    state.worldRevision += output.events.length > 0 ? 1 : 0;
  }

  private respawn(state: MmoTeamState) {
    for (const hero of state.heroes) {
      hero.position = { ...state.sanctuary };
      hero.currentHp = hero.maxHp;
      hero.status = 'alive';
    }
    state.respawnAtTick = null;
    state.weaknessUntilTick = this.tickNumber + this.options.weaknessDurationTicks;
    state.autoHuntEnabled = false;
    state.autoHuntState = 'disabled';
    state.worldRevision += 1;
  }

  private requireTeam(accountId: string) {
    const state = this.teams.get(accountId);
    if (!state) throw new Error('team_not_found');
    return state;
  }
}

function moveOne(position: Vector2, direction: Direction): Vector2 {
  const step = 16;
  if (direction === 'up') return { x: position.x, y: position.y - step };
  if (direction === 'down') return { x: position.x, y: position.y + step };
  if (direction === 'left') return { x: position.x - step, y: position.y };
  return { x: position.x + step, y: position.y };
}

function cloneState(state: MmoTeamState): MmoTeamState {
  return {
    ...state,
    heroes: state.heroes.map((hero) => ({ ...hero, position: { ...hero.position } })),
    monsters: state.monsters.map((monster) => ({ ...monster, position: { ...monster.position } })),
    sanctuary: { ...state.sanctuary },
  };
}
