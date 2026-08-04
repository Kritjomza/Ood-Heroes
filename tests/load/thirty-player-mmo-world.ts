import { performance } from 'node:perf_hooks';
import { TeamSimulation } from '../../apps/game-server/src/mmo/simulation/TeamSimulation.js';

const simulation = new TeamSimulation();
const heroes = (account: string) => [
  { id: `${account}:leader`, role: 'fighter' as const, position: { x: 0, y: 0 }, currentHp: 100, maxHp: 100, attack: 12, defense: 8, level: 1, cooldownTicks: 0, status: 'alive' as const },
  { id: `${account}:tank`, role: 'tank' as const, position: { x: 0, y: 0 }, currentHp: 120, maxHp: 120, attack: 9, defense: 12, level: 1, cooldownTicks: 0, status: 'alive' as const },
  { id: `${account}:support`, role: 'support' as const, position: { x: 0, y: 0 }, currentHp: 80, maxHp: 80, attack: 8, defense: 5, level: 1, cooldownTicks: 0, status: 'alive' as const },
];
for (let player = 0; player < 30; player += 1) {
  const account = `load-${player}`;
  simulation.addTeam(account, heroes(account));
  for (let monster = 0; monster < 12; monster += 1)
    simulation.addMonster(account, { id: `${account}:monster:${monster}`, position: { x: 24 + monster * 8, y: 0 }, currentHp: 80, maxHp: 80, attack: 4, defense: 2, status: 'alive' });
  simulation.setAutoHunt(account, true);
}
const ticks: number[] = [];
for (let tick = 0; tick < 1_000; tick += 1) {
  const started = performance.now();
  simulation.tick();
  ticks.push(performance.now() - started);
}
ticks.sort((a, b) => a - b);
const percentile = (fraction: number) => ticks[Math.ceil(ticks.length * fraction) - 1] ?? 0;
const result = {
  players: 30,
  heroes: 90,
  monsters: 360,
  p95TickMs: Number(percentile(0.95).toFixed(3)),
  p99TickMs: Number(percentile(0.99).toFixed(3)),
};
if (result.p95TickMs > 25 || result.p99TickMs > 40) throw new Error(`MMO world load gate failed: ${JSON.stringify(result)}`);
console.log(JSON.stringify(result));
