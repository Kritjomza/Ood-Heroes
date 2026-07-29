export type EntityId = string;
export type Vector2 = { x: number; y: number };
export type GridPoint = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type EntityStatus = 'alive' | 'defeated' | 'respawning';
export type HeroRole = 'fighter' | 'tank' | 'support';
export type HeroState = {
  id: EntityId;
  name: string;
  role: HeroRole;
  position: Vector2;
  level: number;
  experience: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldownMs: number;
  lastAttackAt: number;
  status: EntityStatus;
};
export type MonsterMode =
  | 'idle'
  | 'wander'
  | 'chase'
  | 'attack'
  | 'returning'
  | 'defeated'
  | 'respawning';
export type MonsterState = {
  id: EntityId;
  spawnPosition: Vector2;
  position: Vector2;
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  aggroRadius: number;
  leashRadius: number;
  attackCooldownMs: number;
  experienceReward: number;
  lastAttackAt: number;
  defeatedAt: number;
  rewardGranted: boolean;
  status: EntityStatus;
  mode: MonsterMode;
};
export type AutoHuntState =
  | 'disabled'
  | 'acquiring-target'
  | 'navigating'
  | 'engaging'
  | 'retreating'
  | 'recovering'
  | 'waiting';
export type Grid = { width: number; height: number; isWalkable: (x: number, y: number) => boolean };
