import { SeededRandom, type Vector2 } from '@odd-tower/game-core';

export type HabitatProfile = {
  id: string;
  spawnPoints: readonly Vector2[];
  targetPopulation: number;
  maxPopulation: number;
  respawnDelayTicks: number;
  monsterKinds: readonly string[];
};

export type EcologyMonster = {
  id: string;
  kind: string;
  position: Vector2;
  spawnPosition: Vector2;
  spawnGeneration: number;
  status: 'alive' | 'defeated';
  respawnAtTick: number | null;
  boss: boolean;
};

export type EcologyDirectorOptions = {
  seed: number;
  dynamicBossActivity: number;
  dynamicBossCooldownTicks: number;
};

export class EcologyDirector {
  private readonly random: SeededRandom;
  private readonly monsters = new Map<string, EcologyMonster>();
  private sequence = 0;
  private tickNumber = 0;
  private activity = 0;
  private lastDynamicBossTick = -Infinity;
  private readonly options: EcologyDirectorOptions;

  constructor(private readonly habitat: HabitatProfile, options: Partial<EcologyDirectorOptions> & Pick<EcologyDirectorOptions, 'seed'>) {
    if (habitat.spawnPoints.length === 0) throw new Error('habitat_requires_spawn_points');
    if (habitat.targetPopulation < 0 || habitat.maxPopulation < habitat.targetPopulation)
      throw new Error('invalid_habitat_population');
    if (habitat.targetPopulation > habitat.spawnPoints.length * 2)
      throw new Error('habitat_population_exceeds_spawn_capacity');
    this.options = {
      dynamicBossActivity: options.dynamicBossActivity ?? 20,
      dynamicBossCooldownTicks: options.dynamicBossCooldownTicks ?? 600,
      seed: options.seed,
    };
    this.random = new SeededRandom(options.seed);
  }

  get tick() {
    return this.tickNumber;
  }

  get zoneActivity() {
    return this.activity;
  }

  recordActivity(amount: number) {
    if (Number.isFinite(amount) && amount > 0) this.activity = Math.min(100, this.activity + amount);
  }

  tickZone() {
    this.tickNumber += 1;
    this.activity = Math.max(0, this.activity * 0.985 - 0.02);
    for (const monster of this.monsters.values()) {
      if (monster.status === 'defeated' && monster.respawnAtTick !== null && monster.respawnAtTick <= this.tickNumber) {
        monster.status = 'alive';
        monster.respawnAtTick = null;
        monster.spawnGeneration += 1;
        monster.position = { ...monster.spawnPosition };
      }
    }
    this.ensurePopulation();
    if (
      this.activity >= this.options.dynamicBossActivity &&
      this.tickNumber - this.lastDynamicBossTick >= this.options.dynamicBossCooldownTicks &&
      !this.hasActiveBoss()
    ) {
      this.spawnBoss(`dynamic-${this.tickNumber}`);
      this.lastDynamicBossTick = this.tickNumber;
      this.activity = 0;
    }
    return this.snapshot();
  }

  defeat(monsterId: string) {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.status === 'defeated') return false;
    monster.status = 'defeated';
    monster.respawnAtTick = monster.boss ? null : this.tickNumber + this.habitat.respawnDelayTicks;
    this.recordActivity(monster.boss ? 5 : 1);
    return true;
  }

  spawnScheduledBoss(eventId: string) {
    if (this.hasActiveBoss()) return null;
    return this.spawnBoss(`scheduled-${eventId}`);
  }

  snapshot() {
    return [...this.monsters.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((monster) => ({
        ...monster,
        position: { ...monster.position },
        spawnPosition: { ...monster.spawnPosition },
      }));
  }

  private ensurePopulation() {
    let activeStandard = [...this.monsters.values()].filter((monster) => !monster.boss && monster.status === 'alive').length;
    let total = [...this.monsters.values()].filter((monster) => monster.status === 'alive').length;
    while (activeStandard < this.habitat.targetPopulation && total + 1 <= this.habitat.maxPopulation) {
      this.spawnStandard();
      activeStandard += 1;
      total += 1;
    }
  }

  private spawnStandard() {
    const spawnPosition = this.habitat.spawnPoints[Math.floor(this.random.next() * this.habitat.spawnPoints.length)]!;
    const kind = this.habitat.monsterKinds[Math.floor(this.random.next() * this.habitat.monsterKinds.length)] ?? 'wild-monster';
    const id = `${this.habitat.id}:monster:${++this.sequence}`;
    this.monsters.set(id, {
      id,
      kind,
      position: { ...spawnPosition },
      spawnPosition: { ...spawnPosition },
      spawnGeneration: 0,
      status: 'alive',
      respawnAtTick: null,
      boss: false,
    });
  }

  private spawnBoss(eventId: string) {
    const spawnPosition = this.habitat.spawnPoints[0]!;
    const id = `${this.habitat.id}:boss:${eventId}`;
    const boss: EcologyMonster = {
      id,
      kind: 'zone-boss',
      position: { ...spawnPosition },
      spawnPosition: { ...spawnPosition },
      spawnGeneration: 0,
      status: 'alive',
      respawnAtTick: null,
      boss: true,
    };
    this.monsters.set(id, boss);
    return { ...boss, position: { ...boss.position }, spawnPosition: { ...boss.spawnPosition } };
  }

  private hasActiveBoss() {
    return [...this.monsters.values()].some((monster) => monster.boss && monster.status === 'alive');
  }
}
