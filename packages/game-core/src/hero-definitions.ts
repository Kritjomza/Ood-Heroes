export type PersistentHeroRole = 'fighter' | 'tank' | 'trickster' | 'healer' | 'support' | 'ranger';

export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PersistentHeroDefinition = {
  id: string;
  slug: string;
  displayName: string;
  role: PersistentHeroRole;
  rarity: HeroRarity;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldownMs: number;
  summonWeight: number;
  duplicateShards: number;
  starterEligible: boolean;
  assetKey: string;
  enabled: boolean;
  sortOrder: number;
};

export const HERO_DEFINITIONS = [
  {
    id: 'hero_001_grilled_chicken',
    slug: 'grilled_chicken',
    displayName: 'Grilled Chicken Executioner',
    role: 'fighter',
    rarity: 'common',
    baseHp: 110,
    baseAttack: 18,
    baseDefense: 4,
    moveSpeed: 120,
    attackRange: 52,
    attackCooldownMs: 800,
    summonWeight: 2750,
    duplicateShards: 10,
    starterEligible: true,
    assetKey: 'hero.grilled_chicken.portrait',
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'hero_002_pink_chocolate_lizard',
    slug: 'pink_chocolate_lizard',
    displayName: 'Pink Chocolate-Dipped Lizard',
    role: 'trickster',
    rarity: 'rare',
    baseHp: 95,
    baseAttack: 17,
    baseDefense: 3,
    moveSpeed: 132,
    attackRange: 58,
    attackCooldownMs: 700,
    summonWeight: 1500,
    duplicateShards: 15,
    starterEligible: false,
    assetKey: 'hero.pink_chocolate_lizard.portrait',
    enabled: true,
    sortOrder: 2,
  },
  {
    id: 'hero_003_robot_jelly',
    slug: 'robot_jelly',
    displayName: 'Robot Jelly',
    role: 'tank',
    rarity: 'common',
    baseHp: 155,
    baseAttack: 11,
    baseDefense: 8,
    moveSpeed: 112,
    attackRange: 48,
    attackCooldownMs: 1000,
    summonWeight: 2750,
    duplicateShards: 10,
    starterEligible: true,
    assetKey: 'hero.robot_jelly.portrait',
    enabled: true,
    sortOrder: 3,
  },
  {
    id: 'hero_004_tofu_rabbit',
    slug: 'tofu_rabbit',
    displayName: 'Tofu Foam Rabbit',
    role: 'healer',
    rarity: 'rare',
    baseHp: 90,
    baseAttack: 13,
    baseDefense: 3,
    moveSpeed: 116,
    attackRange: 90,
    attackCooldownMs: 1100,
    summonWeight: 1500,
    duplicateShards: 15,
    starterEligible: true,
    assetKey: 'hero.tofu_rabbit.portrait',
    enabled: true,
    sortOrder: 4,
  },
  {
    id: 'hero_005_accountant_octopus',
    slug: 'accountant_octopus',
    displayName: 'Accountant Octopus',
    role: 'support',
    rarity: 'epic',
    baseHp: 105,
    baseAttack: 12,
    baseDefense: 5,
    moveSpeed: 114,
    attackRange: 105,
    attackCooldownMs: 1000,
    summonWeight: 1200,
    duplicateShards: 30,
    starterEligible: false,
    assetKey: 'hero.accountant_octopus.portrait',
    enabled: true,
    sortOrder: 5,
  },
  {
    id: 'hero_006_samurai_bread',
    slug: 'samurai_bread',
    displayName: 'Samurai Bread',
    role: 'ranger',
    rarity: 'legendary',
    baseHp: 100,
    baseAttack: 22,
    baseDefense: 4,
    moveSpeed: 118,
    attackRange: 150,
    attackCooldownMs: 1200,
    summonWeight: 300,
    duplicateShards: 60,
    starterEligible: false,
    assetKey: 'hero.samurai_bread.portrait',
    enabled: true,
    sortOrder: 6,
  },
] as const satisfies readonly PersistentHeroDefinition[];

export const SUMMON_WEIGHTS = {
  hero_001_grilled_chicken: 2750,
  hero_002_pink_chocolate_lizard: 1500,
  hero_003_robot_jelly: 2750,
  hero_004_tofu_rabbit: 1500,
  hero_005_accountant_octopus: 1200,
  hero_006_samurai_bread: 300,
} as const;
