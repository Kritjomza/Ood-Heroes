import { ColyseusSDK, type Room } from '@colyseus/sdk';
import { NETWORK_CONFIG, PROTOCOL_VERSION, type CombatEvent } from '@odd-tower/network-protocol';
import { createGameServer } from '../../apps/game-server/src/app.js';

type Monster = { id: string; status: string; spawnGeneration: number };
type CombatPlayer = { sessionGold: number; autoHuntState: string };
type CombatRoomState = {
  playerCount: number;
  serverTick: number;
  players: Map<string, unknown>;
  monsters: Map<string, Monster>;
  combatPlayers: Map<string, CombatPlayer>;
};

const durationMs = Number(process.env.COMBAT_LOAD_DURATION_MS ?? 60_000);
const port = Number(process.env.COMBAT_LOAD_SERVER_PORT ?? 2571);
if (!Number.isFinite(durationMs) || durationMs < 1_000)
  throw new Error('COMBAT_LOAD_DURATION_MS must be at least 1000.');
const host = '127.0.0.1';
const httpUrl = `http://${host}:${port}`;
process.env.ODD_TOWER_TEST_MODE = '1';
const server = createGameServer({ port, host, clientOrigin: 'http://127.0.0.1:4173' });
const rooms: Room<unknown, CombatRoomState>[] = [];
const intervals: ReturnType<typeof setInterval>[] = [];
const startedAt = Date.now();
const heapStartBytes = process.memoryUsage().heapUsed;
const rewardIds = new Set<string>();
const duplicateRewardIds = new Set<string>();
const rewardIdsByClient = Array.from(
  { length: NETWORK_CONFIG.roomCapacity },
  () => new Set<string>(),
);
const generations = new Map<string, number>();
const defeated = new Set<string>();
const latencySamples: number[] = [];
let commandsSent = 0;
let monsterKills = 0;
let monsterRespawns = 0;
let peakActiveMonsters = 0;
let unexpectedDisconnects = 0;
let rejectedValidCommands = 0;
let serverErrors = 0;
let running = true;

function waitFor(check: () => boolean | Promise<boolean>, timeoutMs: number, label: string) {
  return new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = async () => {
      if (await check()) return resolve();
      if (Date.now() >= deadline) return reject(new Error(`Timed out waiting for ${label}`));
      setTimeout(poll, 25);
    };
    poll();
  });
}

try {
  await server.listen(port, host);
  const response = await fetch(`${httpUrl}/rooms`, { method: 'POST' });
  const summary = (await response.json()) as { roomId: string };
  for (let index = 0; index < NETWORK_CONFIG.roomCapacity; index++) {
    const sdk = new ColyseusSDK(`ws://${host}:${port}`);
    const room = await sdk.joinById<CombatRoomState>(summary.roomId, {
      displayName: `CombatBot${index + 1}`,
      protocolVersion: PROTOCOL_VERSION,
    });
    room.onLeave(() => {
      if (running) unexpectedDisconnects += 1;
    });
    room.onMessage<{ code?: string }>('error', (message) => {
      if (message.code === 'RATE_LIMITED' || message.code === 'STALE_SEQUENCE')
        rejectedValidCommands += 1;
      else serverErrors += 1;
    });
    room.onMessage<CombatEvent>('combat-event', (event) => {
      if (event.type !== 'reward-granted') return;
      if (rewardIdsByClient[index]!.has(event.id)) duplicateRewardIds.add(event.id);
      rewardIdsByClient[index]!.add(event.id);
      rewardIds.add(event.id);
    });
    room.onStateChange((state) => {
      let active = 0;
      state.monsters?.forEach((monster) => {
        if (monster.status === 'alive') active += 1;
        if (monster.status === 'defeated' && !defeated.has(monster.id)) {
          defeated.add(monster.id);
          monsterKills += 1;
        }
        if (monster.status === 'alive') defeated.delete(monster.id);
        const prior = generations.get(monster.id) ?? monster.spawnGeneration;
        if (monster.spawnGeneration > prior) monsterRespawns += monster.spawnGeneration - prior;
        generations.set(monster.id, monster.spawnGeneration);
      });
      peakActiveMonsters = Math.max(peakActiveMonsters, active);
    });
    rooms.push(room);
  }
  await waitFor(
    () => rooms.every((room) => room.state.players?.size === 10 && room.state.monsters?.size >= 34),
    10_000,
    'ten combat clients and monsters',
  );
  const firstMonster = [...rooms[0]!.state.monsters.keys()][0]!;
  rooms.forEach((room, index) => {
    room.send('command', {
      type: 'focus-target',
      targetMonsterId: firstMonster,
      clientSentAtMs: Date.now(),
    });
    room.send('command', { type: 'auto-hunt', enabled: true, clientSentAtMs: Date.now() });
    commandsSent += 2;
    room.ping((latency) => latencySamples.push(latency));
    if (index < 2) {
      let sequence = 0;
      intervals.push(
        setInterval(() => {
          room.send('command', {
            type: 'move',
            sequence: ++sequence,
            direction: sequence % 2 ? 'right' : 'none',
            clientSentAtMs: Date.now(),
          });
          commandsSent += 1;
        }, 100),
      );
    }
  });
  const tickStart = rooms[0]!.state.serverTick;
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
  const tickEnd = rooms[0]!.state.serverTick;
  const diagnosticsResponse = await fetch(`${httpUrl}/test/rooms/${summary.roomId}/metrics`);
  if (!diagnosticsResponse.ok) throw new Error('Unable to read room diagnostics.');
  const diagnostics = (await diagnosticsResponse.json()) as Record<string, number>;
  const goldTotal = [...(rooms[0]!.state.combatPlayers?.values() ?? [])].reduce(
    (sum, player) => sum + player.sessionGold,
    0,
  );
  running = false;
  intervals.forEach(clearInterval);
  await Promise.all(rooms.map((room) => room.leave(true)));
  await waitFor(
    () =>
      fetch(`${httpUrl}/health`)
        .then((value) => value.json())
        .then((health: { activeRooms: number }) => health.activeRooms === 0),
    5_000,
    'room cleanup',
  );
  const elapsedMs = Date.now() - startedAt;
  const expectedTicks = durationMs / NETWORK_CONFIG.tickMs;
  const observedTicks = tickEnd - tickStart;
  const effectiveHz = observedTicks / (durationMs / 1_000);
  const result = {
    configuredDurationMs: durationMs,
    elapsedMs,
    connectedPlayers: rooms.length,
    peakActiveMonsters,
    commandsSent,
    monsterKills,
    monsterRespawns,
    rewardGrants: rewardIds.size,
    duplicateRewardIds: duplicateRewardIds.size,
    sessionGoldObserved: goldTotal,
    unexpectedDisconnects,
    rejectedValidCommands,
    serverErrors,
    expectedTicks,
    observedTicks,
    tickDrift: observedTicks - expectedTicks,
    effectiveHz,
    tickRatePercentage: (observedTicks / expectedTicks) * 100,
    averageTickDurationMs: diagnostics.averageTickDurationMs,
    p50TickDurationMs: diagnostics.p50TickDurationMs,
    p95TickDurationMs: diagnostics.p95TickDurationMs,
    p99TickDurationMs: diagnostics.p99TickDurationMs,
    maxTickDurationMs: diagnostics.maxTickDurationMs,
    lateTicks: diagnostics.lateTicks,
    lateCallbacks: diagnostics.lateCallbacks,
    skippedSteps: diagnostics.skippedSteps,
    aiDecisions: diagnostics.aiDecisions,
    pathCalculations: diagnostics.pathCalculations,
    nearbyQueries: diagnostics.nearbyQueries,
    wanderDecisions: diagnostics.wanderDecisions,
    stuckRecoveries: diagnostics.stuckRecoveries,
    unreachableFailures: diagnostics.unreachableFailures,
    chargeExecutions: diagnostics.chargeExecutions,
    healExecutions: diagnostics.healExecutions,
    slowApplications: diagnostics.slowApplications,
    heroAttacksResolved: diagnostics.heroAttacksResolved,
    monsterAttacksResolved: diagnostics.monsterAttacksResolved,
    eventsCreated: diagnostics.eventsCreated,
    eventsCreatedPerSecond: diagnostics.eventsCreated / (durationMs / 1_000),
    eventsRemoved: diagnostics.eventsRemoved,
    consecutiveLateTicks: diagnostics.consecutiveLateTicks,
    maximumConsecutiveLateTicks: diagnostics.maximumConsecutiveLateTicks,
    retainedEvents: diagnostics.retainedEvents,
    pendingEvents: diagnostics.pendingEvents,
    processedRewardKeys: diagnostics.processedRewardKeys,
    contributionEntries: diagnostics.contributionEntries,
    pathCacheEntries: diagnostics.pathCacheEntries,
    spatialEntries: diagnostics.spatialEntries,
    schemaValuesUpdated: diagnostics.schemaValuesUpdated,
    effectArraysRebuilt: diagnostics.effectArraysRebuilt,
    averageLatencyMs: latencySamples.length
      ? Math.round(latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length)
      : null,
    heapDeltaBytes: process.memoryUsage().heapUsed - heapStartBytes,
    cleanup: 'passed',
  };
  console.log(JSON.stringify(result, null, 2));
  if (
    (durationMs >= 60_000 &&
      (monsterKills < 1 ||
        rewardIds.size < 1 ||
        observedTicks < expectedTicks * 0.95 ||
        effectiveHz < 19)) ||
    duplicateRewardIds.size ||
    unexpectedDisconnects ||
    rejectedValidCommands ||
    serverErrors
  )
    throw new Error('Shared combat load acceptance counters failed.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  running = false;
  intervals.forEach(clearInterval);
  await Promise.allSettled(
    rooms.filter((room) => room.connection?.isOpen).map((room) => room.leave(true)),
  );
  server.transport.shutdown();
}

process.exit(process.exitCode ?? 0);
