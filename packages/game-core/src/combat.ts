import { formationDestination } from './rules.js';
import type { Direction, HeroRole, Vector2 } from './types.js';

export class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = Number.isFinite(seed) ? seed >>> 0 : 0x6d2b79f5;
  }
  next() {
    this.state = (this.state * 1_664_525 + 1_013_904_223) >>> 0;
    return this.state / 0x1_0000_0000;
  }
}

export function calculateAuthoritativeDamage(attack: number, defense: number, rng: () => number) {
  if (!Number.isFinite(attack) || !Number.isFinite(defense) || attack < 0 || defense < 0) return 0;
  const roll = rng();
  if (!Number.isFinite(roll)) return 0;
  const base = Math.max(1, attack - defense * 0.5);
  return Math.max(1, Math.floor(base * (0.9 + Math.min(1, Math.max(0, roll)) * 0.2)));
}

export const effectiveHeroPosition = (anchor: Vector2, facing: Direction, role: HeroRole) =>
  formationDestination(anchor, facing, role);

type HeroTargetCandidate = { id: string; distance: number; alive: boolean; inSafeZone: boolean };
export function chooseHeroTarget<T extends HeroTargetCandidate>(
  candidates: readonly T[],
  focusedId: string | null,
  currentId: string | null,
) {
  const valid = candidates.filter((candidate) => candidate.alive && !candidate.inSafeZone);
  return (
    valid.find((candidate) => candidate.id === focusedId) ??
    valid.find((candidate) => candidate.id === currentId) ??
    [...valid].sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))[0]
  );
}

type MonsterTargetCandidate = { id: string; role: HeroRole; distance: number; valid: boolean };
export function chooseMonsterTarget<T extends MonsterTargetCandidate>(candidates: readonly T[]) {
  return [...candidates]
    .filter((candidate) => candidate.valid)
    .sort(
      (a, b) =>
        a.distance * (a.role === 'tank' ? 0.85 : 1) - b.distance * (b.role === 'tank' ? 0.85 : 1) ||
        a.id.localeCompare(b.id),
    )[0];
}

export type MovementSlow = {
  type: 'movement-slow';
  sourceMonsterId: string;
  magnitude: number;
  startTick: number;
  expirationTick: number;
};

export function refreshMovementSlow(
  _effects: readonly MovementSlow[],
  sourceMonsterId: string,
  startTick: number,
  durationTicks: number,
): MovementSlow[] {
  return [
    {
      type: 'movement-slow',
      sourceMonsterId,
      magnitude: 0.2,
      startTick,
      expirationTick: startTick + durationTicks,
    },
  ];
}

export const expireStatusEffects = (effects: readonly MovementSlow[], tick: number) =>
  effects.filter((effect) => effect.expirationTick > tick);

export function contributionIsEligible(
  entry: { damageDealt: number; lastContributionTick: number },
  monsterMaxHp: number,
  deathTick: number,
) {
  const minimum = Math.max(1, Math.floor(monsterMaxHp * 0.01));
  return entry.damageDealt >= minimum && deathTick - entry.lastContributionTick <= 200;
}

export const rewardIdentity = (roomId: string, monsterId: string, spawnGeneration: number) =>
  `${roomId}:${monsterId}:${spawnGeneration}`;
