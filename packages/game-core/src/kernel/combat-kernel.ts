import { calculateAuthoritativeDamage, SeededRandom } from '../combat.js';

export const COMBAT_KERNEL_VERSION = 1 as const;

export type CombatKernelEntity = {
  readonly id: string;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly cooldownReadyTick: number;
};

export type CombatKernelIntent = {
  readonly sourceId: string;
  readonly targetId: string;
  readonly kind: 'basic-attack';
};

export type CombatKernelInput = {
  readonly tick: number;
  readonly seed: number;
  readonly heroes: readonly CombatKernelEntity[];
  readonly monsters: readonly CombatKernelEntity[];
  readonly intents: readonly CombatKernelIntent[];
};

export type CombatKernelEvent = {
  readonly id: string;
  readonly tick: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly kind: 'basic-attack';
  readonly damage: number;
};

export type CombatKernelOutput = {
  readonly heroes: CombatKernelEntity[];
  readonly monsters: CombatKernelEntity[];
  readonly events: CombatKernelEvent[];
};

export function stepCombatKernel(input: Readonly<CombatKernelInput>): CombatKernelOutput {
  const heroes = input.heroes.map((hero) => ({ ...hero }));
  const monsters = input.monsters.map((monster) => ({ ...monster }));
  const entities = new Map([...heroes, ...monsters].map((entity) => [entity.id, entity]));
  const random = new SeededRandom(input.seed);
  const events: CombatKernelEvent[] = [];

  const intents = [...input.intents].sort(
    (left, right) =>
      left.sourceId.localeCompare(right.sourceId) || left.targetId.localeCompare(right.targetId),
  );

  for (const intent of intents) {
    const source = entities.get(intent.sourceId);
    const target = entities.get(intent.targetId);
    if (!source || !target || source.currentHp <= 0 || target.currentHp <= 0) continue;
    if (source.cooldownReadyTick > input.tick) continue;

    const damage = calculateAuthoritativeDamage(source.attack, target.defense, () => random.next());
    target.currentHp = Math.max(0, target.currentHp - damage);
    events.push({
      id: `${input.tick}:${source.id}:${target.id}:${intent.kind}`,
      tick: input.tick,
      sourceId: source.id,
      targetId: target.id,
      kind: intent.kind,
      damage,
    });
  }

  return { heroes, monsters, events };
}
