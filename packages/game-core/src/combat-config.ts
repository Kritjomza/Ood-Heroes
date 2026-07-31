export type MonsterDefinitionId =
  | 'grumpy-radish'
  | 'jumping-sauce-bag'
  | 'shoe-biting-dust-ball'
  | 'wild-sausage'
  | 'lost-pudding';

export type MonsterSpecial = 'none' | 'slow' | 'charge' | 'heal';

export type MonsterDefinition = {
  name: string;
  levelRange: readonly [number, number];
  baseLevel: number;
  baseMaxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldownTicks: number;
  aggroRadius: number;
  leashRadius: number;
  experienceReward: number;
  goldReward: number;
  respawnTicks: number;
  special: MonsterSpecial;
};

export const MONSTER_DEFINITIONS: Record<MonsterDefinitionId, MonsterDefinition> = {
  'grumpy-radish': {
    name: 'Grumpy Radish',
    levelRange: [1, 3],
    baseLevel: 1,
    baseMaxHp: 45,
    attack: 7,
    defense: 1,
    moveSpeed: 65,
    attackRange: 38,
    attackCooldownTicks: 24,
    aggroRadius: 140,
    leashRadius: 260,
    experienceReward: 20,
    goldReward: 5,
    respawnTicks: 100,
    special: 'none',
  },
  'jumping-sauce-bag': {
    name: 'Jumping Sauce Bag',
    levelRange: [2, 4],
    baseLevel: 2,
    baseMaxHp: 38,
    attack: 9,
    defense: 0,
    moveSpeed: 90,
    attackRange: 34,
    attackCooldownTicks: 18,
    aggroRadius: 165,
    leashRadius: 300,
    experienceReward: 24,
    goldReward: 6,
    respawnTicks: 100,
    special: 'none',
  },
  'shoe-biting-dust-ball': {
    name: 'Shoe-Biting Dust Ball',
    levelRange: [3, 5],
    baseLevel: 3,
    baseMaxHp: 60,
    attack: 8,
    defense: 2,
    moveSpeed: 60,
    attackRange: 40,
    attackCooldownTicks: 26,
    aggroRadius: 145,
    leashRadius: 270,
    experienceReward: 30,
    goldReward: 8,
    respawnTicks: 120,
    special: 'slow',
  },
  'wild-sausage': {
    name: 'Wild Sausage',
    levelRange: [5, 7],
    baseLevel: 5,
    baseMaxHp: 115,
    attack: 13,
    defense: 5,
    moveSpeed: 68,
    attackRange: 42,
    attackCooldownTicks: 30,
    aggroRadius: 175,
    leashRadius: 320,
    experienceReward: 42,
    goldReward: 12,
    respawnTicks: 160,
    special: 'charge',
  },
  'lost-pudding': {
    name: 'Lost Pudding',
    levelRange: [4, 6],
    baseLevel: 4,
    baseMaxHp: 72,
    attack: 5,
    defense: 2,
    moveSpeed: 55,
    attackRange: 75,
    attackCooldownTicks: 32,
    aggroRadius: 135,
    leashRadius: 250,
    experienceReward: 36,
    goldReward: 10,
    respawnTicks: 140,
    special: 'heal',
  },
};

export const COMBAT_CONFIG = {
  aiDecisionTicks: 4,
  pathRecalculationTicks: 10,
  wanderDecisionTicks: 20,
  wanderRadius: 96,
  spatialCellSize: 160,
  progressThreshold: 4,
  waypointReachDistance: 1,
  stuckDurationTicks: 12,
  maximumPathFailures: 3,
  safeHealPerTick: 0.005,
  monsterReturnHealPerTick: 0.005,
  individualReviveTicks: 100,
  teamRespawnTicks: 100,
  contributionWindowTicks: 200,
  slowMagnitude: 0.2,
  slowDurationTicks: 40,
  puddingHealTicks: 60,
  puddingHealRange: 120,
  puddingHealAmount: 16,
  chargeWindupTicks: 15,
  chargeCooldownTicks: 100,
  chargeSpeed: 230,
  autoHuntRetryTicks: 10,
  autoHuntBlacklistTicks: 100,
  autoHuntBlacklistLimit: 8,
  eventLimit: 128,
} as const;
