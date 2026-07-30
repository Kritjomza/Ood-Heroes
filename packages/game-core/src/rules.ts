import type { AutoHuntState, Direction, HeroRole, MonsterMode, Vector2 } from './types.js';
export const distance = (a: Vector2, b: Vector2) => Math.hypot(a.x - b.x, a.y - b.y);
export function calculateDamage(attack: number, defense: number, rng: () => number) {
  const base = Math.max(1, attack - defense * 0.5);
  return Math.max(1, Math.floor(base * (0.9 + Math.min(1, Math.max(0, rng())) * 0.2)));
}
export const canAttack = (now: number, last: number, cooldown: number) => now - last >= cooldown;
export const requiredExperienceForNextLevel = (level: number) => Math.floor(50 * level ** 1.35);
type Progress = {
  level: number;
  experience: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
};
export function applyExperience(input: Progress, reward: number): Progress {
  const s = { ...input, experience: input.experience + reward };
  while (s.level < 20 && s.experience >= requiredExperienceForNextLevel(s.level)) {
    s.experience -= requiredExperienceForNextLevel(s.level);
    s.level++;
    const old = s.maxHp;
    s.maxHp = Math.round(s.maxHp * 1.1);
    s.currentHp = Math.min(s.maxHp, s.currentHp + s.maxHp - old);
    s.attack = Math.round(s.attack * 1.08);
    s.defense = Math.round(s.defense * 1.06);
  }
  if (s.level === 20) s.experience = 0;
  return s;
}
const OFFSETS: Record<Direction, Record<Exclude<HeroRole, 'fighter'>, Vector2>> = {
  up: { tank: { x: -42, y: 48 }, support: { x: 42, y: 48 } },
  down: { tank: { x: 42, y: -48 }, support: { x: -42, y: -48 } },
  left: { tank: { x: 48, y: 42 }, support: { x: 48, y: -42 } },
  right: { tank: { x: -48, y: -42 }, support: { x: -48, y: 42 } },
};
export function formationDestination(anchor: Vector2, direction: Direction, role: HeroRole) {
  if (role === 'fighter') return { ...anchor };
  const o = OFFSETS[direction][role];
  return { x: anchor.x + o.x, y: anchor.y + o.y };
}
export const shouldRecoverFollower = (a: Vector2, b: Vector2, maxDistance: number) =>
  distance(a, b) > maxDistance;
export function chooseAutoHuntTarget<
  T extends { distance: number; alive: boolean; reachable: boolean; inSafeZone: boolean },
>(items: T[]) {
  return items
    .filter((x) => x.alive && x.reachable && !x.inSafeZone)
    .sort((a, b) => a.distance - b.distance)[0];
}
export function nextAutoHuntState(i: {
  enabled: boolean;
  hpRatio: number;
  allDefeated: boolean;
  manualInput: boolean;
  paused: boolean;
  hasTarget: boolean;
  inSafeZone: boolean;
  current?: AutoHuntState;
}): AutoHuntState {
  if (!i.enabled || i.allDefeated || i.manualInput || i.paused) return 'disabled';
  if (i.hpRatio < 0.25) return 'retreating';
  if (i.current === 'retreating' && i.inSafeZone) return 'recovering';
  if (i.current === 'recovering') return i.hpRatio >= 0.8 ? 'acquiring-target' : 'recovering';
  if (i.hasTarget) return 'navigating';
  return i.current === 'acquiring-target' ? 'waiting' : 'acquiring-target';
}
export function nextMonsterMode(i: {
  distanceToHero: number;
  distanceFromSpawn: number;
  heroInSafeZone: boolean;
  heroAlive: boolean;
  aggroRadius: number;
  leashRadius: number;
}): MonsterMode {
  if (i.distanceFromSpawn > i.leashRadius || i.heroInSafeZone || !i.heroAlive) return 'returning';
  if (i.distanceToHero <= i.aggroRadius) return 'chase';
  return 'idle';
}
export const canMonsterAttack = (heroAlive: boolean) => heroAlive;
export const monsterRespawnReady = (now: number, defeatedAt: number, delay: number) =>
  now - defeatedAt >= delay;
export function awardDefeatOnce(state: { granted: boolean }) {
  if (state.granted) return false;
  state.granted = true;
  return true;
}
