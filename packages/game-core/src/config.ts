import type { HeroRole } from './types';
export const WORLD = {
  tiles: 64,
  tileSize: 32,
  size: 2048,
  safeCenter: { x: 1024, y: 1024 },
  safeRadius: 190,
  heroRespawnMs: 5000,
  safeRegenPerSecond: 0.1,
  autoRetreat: 0.25,
  autoRecover: 0.8,
} as const;
export const HERO_CONFIG: Record<
  HeroRole,
  {
    name: string;
    maxHp: number;
    attack: number;
    defense: number;
    moveSpeed: number;
    attackRange: number;
    attackCooldownMs: number;
  }
> = {
  fighter: {
    name: 'Grilled Chicken',
    maxHp: 110,
    attack: 18,
    defense: 4,
    moveSpeed: 120,
    attackRange: 52,
    attackCooldownMs: 800,
  },
  tank: {
    name: 'Robot Jelly',
    maxHp: 155,
    attack: 11,
    defense: 8,
    moveSpeed: 112,
    attackRange: 48,
    attackCooldownMs: 1000,
  },
  support: {
    name: 'Tofu Rabbit',
    maxHp: 90,
    attack: 13,
    defense: 3,
    moveSpeed: 116,
    attackRange: 90,
    attackCooldownMs: 1100,
  },
};
export const MONSTER = {
  maxHp: 45,
  attack: 7,
  defense: 1,
  moveSpeed: 65,
  attackRange: 38,
  aggroRadius: 140,
  leashRadius: 260,
  attackCooldownMs: 1200,
  respawnMs: 5000,
  experienceReward: 20,
} as const;
