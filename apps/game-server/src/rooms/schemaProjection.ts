type StatusEffectLike = { type: string; magnitude: number; expirationTick: number };

export function assignChanged(target: object, source: object) {
  let writes = 0;
  for (const [key, value] of Object.entries(source))
    if ((target as Record<string, unknown>)[key] !== value) {
      (target as Record<string, unknown>)[key] = value;
      writes += 1;
    }
  return writes;
}

export function statusEffectSignature(effects: readonly StatusEffectLike[]) {
  return effects
    .map((effect) => `${effect.type}:${effect.magnitude}:${effect.expirationTick}`)
    .join('|');
}
