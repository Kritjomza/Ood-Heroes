export function worldScaleForHeight(sourceHeight: number, targetWorldHeight: number): number {
  if (!Number.isFinite(sourceHeight) || sourceHeight <= 0) return 1;
  return targetWorldHeight / sourceHeight;
}

export function composeWorldScale(base: number, motionX: number, motionY: number) {
  return { x: base * motionX, y: base * motionY };
}

export const WORLD_SPRITE_HEIGHT = {
  hero: { fighter: 76, tank: 84, support: 72 },
  monster: 58,
  boss: 144,
} as const;

