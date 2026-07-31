// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSimulationPlayer } from '../src/simulation/playerSimulation';
import { CombatSimulation } from '../src/simulation/CombatSimulation';

function tickMany(
  combat: CombatSimulation,
  players: ReturnType<typeof createSimulationPlayer>[],
  count: number,
) {
  const map = new Map(players.map((player) => [player.state.id, player]));
  for (let index = 0; index < count; index++) combat.tick(map);
}

describe('authoritative shared combat simulation', () => {
  it('creates one shared validated 34-monster population and scales without exceeding 50', () => {
    const combat = new CombatSimulation('room-a', 123);
    expect(combat.monsterSnapshots()).toHaveLength(34);
    expect(new Set(combat.monsterSnapshots().map((monster) => monster.id)).size).toBe(34);
    expect(
      combat
        .monsterSnapshots()
        .every((monster) => Number.isFinite(monster.x) && Number.isFinite(monster.y)),
    ).toBe(true);
    for (let index = 0; index < 10; index++) combat.addPlayer(`p${index}`);
    expect(combat.monsterSnapshots().length).toBeGreaterThan(34);
    expect(combat.monsterSnapshots().length).toBeLessThanOrEqual(50);
  });

  it('lets two players damage one monster, rewards each eligible player once, and respawns once', () => {
    const combat = new CombatSimulation('room-b', 4);
    combat.addPlayer('a');
    combat.addPlayer('b');
    const target = combat.monsterSnapshots()[0]!;
    const a = createSimulationPlayer('a', 'Alpha', { x: target.x, y: target.y + 45 });
    const b = createSimulationPlayer('b', 'Bravo', { x: target.x + 20, y: target.y + 45 });
    combat.focusTarget('a', target.id);
    combat.focusTarget('b', target.id);
    tickMany(combat, [a, b], 100);
    const defeated = combat.monsterSnapshots().find((monster) => monster.id === target.id)!;
    expect(defeated.status).not.toBe('alive');
    expect(combat.playerSnapshot('a')!.sessionGold).toBeGreaterThan(0);
    expect(combat.playerSnapshot('b')!.sessionGold).toBeGreaterThan(0);
    const rewardEvents = combat.events().filter((event) => event.type === 'reward-granted');
    expect(new Set(rewardEvents.map((event) => event.id)).size).toBe(rewardEvents.length);
    const generation = defeated.spawnGeneration;
    Object.assign(a.state, { x: 1024, y: 1024 });
    Object.assign(b.state, { x: 1024, y: 1024 });
    tickMany(combat, [a, b], 200);
    const respawned = combat.monsterSnapshots().find((monster) => monster.id === target.id)!;
    expect(respawned.status).toBe('alive');
    expect(respawned.spawnGeneration).toBe(generation + 1);
  });

  it('runs Auto Hunt on the server and valid manual movement disables it immediately', () => {
    const combat = new CombatSimulation('room-c', 8);
    combat.addPlayer('a');
    const player = createSimulationPlayer('a', 'Alpha', { x: 1024, y: 1024 });
    combat.setAutoHunt('a', true);
    tickMany(combat, [player], 20);
    expect(combat.playerSnapshot('a')!.autoHuntState).not.toBe('disabled');
    combat.manualMovement('a', 'right');
    expect(combat.playerSnapshot('a')).toMatchObject({
      autoHuntEnabled: false,
      autoHuntState: 'disabled',
    });
  });

  it('preserves session rewards through a wipe and performs a five-second full respawn', () => {
    const combat = new CombatSimulation('room-d', 9);
    combat.addPlayer('a');
    const player = createSimulationPlayer('a', 'Alpha', { x: 500, y: 500 });
    for (const hero of combat.playerSnapshot('a')!.heroes)
      combat.applyHeroDamage('a', hero.id, hero.maxHp, 'monster-test');
    tickMany(combat, [player], 1);
    const wiped = combat.playerSnapshot('a')!;
    expect(wiped.teamRespawnAtTick).not.toBeNull();
    expect(wiped.autoHuntState).toBe('disabled');
    tickMany(combat, [player], 100);
    expect(combat.playerSnapshot('a')!.heroes.every((hero) => hero.currentHp === hero.maxHp)).toBe(
      true,
    );
    expect(player.state).toMatchObject({ x: 1024, y: 1024 });
  });

  it('lets Lost Pudding heal an injured nearby living monster without creating contribution', () => {
    const combat = new CombatSimulation('room-heal', 12);
    const pudding = combat
      .monsterSnapshots()
      .find((monster) => monster.definitionId === 'lost-pudding')!;
    const ally = combat
      .monsterSnapshots()
      .find(
        (monster) =>
          monster.id !== pudding.id &&
          Math.hypot(monster.x - pudding.x, monster.y - pudding.y) <= 120,
      )!;
    expect(ally).toBeDefined();
    combat.applyMonsterDamage(null, ally.id, 20);
    const before = combat.monsterSnapshots().find((monster) => monster.id === ally.id)!.currentHp;
    tickMany(combat, [], 70);
    expect(
      combat.monsterSnapshots().find((monster) => monster.id === ally.id)!.currentHp,
    ).toBeGreaterThan(before);
    expect(
      combat.events().some((event) => event.type === 'monster-heal' && event.targetId === ally.id),
    ).toBe(true);
  });

  it('emits a Wild Sausage charge warning and applies at most one charge impact per hero', () => {
    const combat = new CombatSimulation('room-charge', 14);
    combat.addPlayer('a');
    const sausage = combat
      .monsterSnapshots()
      .find((monster) => monster.definitionId === 'wild-sausage')!;
    const player = createSimulationPlayer('a', 'Alpha', { x: sausage.x + 100, y: sausage.y });
    tickMany(combat, [player], 40);
    expect(
      combat
        .events()
        .some((event) => event.type === 'charge-warning' && event.sourceId === sausage.id),
    ).toBe(true);
    const impacts = combat.events().filter((event) => event.type === 'charge-impact');
    expect(new Set(impacts.map((event) => `${event.sourceId}:${event.targetId}`)).size).toBe(
      impacts.length,
    );
  });

  it('separates 5 Hz AI decisions from 20 Hz movement and bounds path searches', () => {
    const combat = new CombatSimulation('room-cadence', 21);
    combat.addPlayer('a');
    const player = createSimulationPlayer('a', 'Alpha', { x: 500, y: 500 });
    tickMany(combat, [player], 20);
    const diagnostics = combat.diagnostics();
    expect(diagnostics.ticks).toBe(20);
    expect(diagnostics.aiDecisions).toBeGreaterThanOrEqual(34 * 4);
    expect(diagnostics.aiDecisions).toBeLessThanOrEqual(36 * 5);
    expect(diagnostics.pathCalculations).toBeLessThanOrEqual(36 * 2);
  });

  it('wanders deterministically without timers and clears navigation structures on disposal', () => {
    const first = new CombatSimulation('room-wander-a', 33);
    const second = new CombatSimulation('room-wander-b', 33);
    const before = first.monsterSnapshots().map(({ id, x, y }) => ({ id, x, y }));
    tickMany(first, [], 80);
    tickMany(second, [], 80);
    expect(first.monsterSnapshots().map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      second.monsterSnapshots().map(({ id, x, y }) => ({ id, x, y })),
    );
    expect(
      first
        .monsterSnapshots()
        .some((monster, index) => monster.x !== before[index]!.x || monster.y !== before[index]!.y),
    ).toBe(true);
    expect(first.diagnostics().wanderDecisions).toBeGreaterThan(0);
    first.dispose();
    expect(first.diagnostics()).toMatchObject({
      monsterCount: 0,
      retainedEvents: 0,
      contributionEntries: 0,
      pathCacheEntries: 0,
      spatialEntries: 0,
    });
  });

  it('centers on a cached waypoint before turning through a one-tile wall gap', () => {
    const combat = new CombatSimulation('room-wall', 1);
    combat.addPlayer('a');
    const player = createSimulationPlayer('a', 'Alpha', { x: 656, y: 528 });
    const monsterId = combat.setupWallNavigation('a')!;
    tickMany(combat, [player], 100);
    const monster = combat.monsterSnapshots().find((candidate) => candidate.id === monsterId)!;
    expect(combat.diagnostics().pathCalculations).toBeGreaterThan(0);
    expect(monster.x).toBeGreaterThan(608);
  });
});
