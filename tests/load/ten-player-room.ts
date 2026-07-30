import { ColyseusSDK, type Room } from '@colyseus/sdk';
import {
  NETWORK_CONFIG,
  PROTOCOL_VERSION,
  type CardinalDirection,
} from '@odd-tower/network-protocol';
import { createGameServer } from '../../apps/game-server/src/app.js';

type LoadRoomState = {
  playerCount: number;
  players: Map<string, unknown>;
};

const durationMs = Number(process.env.LOAD_TEST_DURATION_MS ?? 60_000);
const port = Number(process.env.LOAD_SERVER_PORT ?? 2570);
const host = '127.0.0.1';
const httpUrl = `http://${host}:${port}`;
const wsUrl = `ws://${host}:${port}`;
const directions: CardinalDirection[] = ['up', 'down', 'left', 'right', 'none'];

if (!Number.isFinite(durationMs) || durationMs < 1_000)
  throw new Error('LOAD_TEST_DURATION_MS must be a finite value of at least 1000.');

const gameServer = createGameServer({ port, host, clientOrigin: 'http://127.0.0.1:4173' });
const rooms: Room<unknown, LoadRoomState>[] = [];
const intervals: ReturnType<typeof setInterval>[] = [];
const startMemory = process.memoryUsage().heapUsed;
const startedAt = Date.now();
let commandsSent = 0;
let rejectedValidCommands = 0;
let unexpectedDisconnects = 0;
let serverErrors = 0;
const latencySamples: number[] = [];
let running = true;
let phase = 'server startup';
const watchdog = setTimeout(() => {
  console.error(`Load test exceeded its deadline during: ${phase}`);
  process.exit(2);
}, durationMs + 15_000);

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

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

try {
  await gameServer.listen(port, host);
  phase = 'room creation';
  const response = await fetch(`${httpUrl}/rooms`, { method: 'POST' });
  if (!response.ok) throw new Error(`Room creation returned HTTP ${response.status}`);
  const summary = (await response.json()) as { roomId: string; roomCode: string };

  for (let index = 0; index < NETWORK_CONFIG.roomCapacity; index++) {
    phase = `client ${index + 1} join`;
    const sdk = new ColyseusSDK(wsUrl);
    const room = await sdk.joinById<LoadRoomState>(summary.roomId, {
      displayName: `LoadBot${index + 1}`,
      protocolVersion: PROTOCOL_VERSION,
    });
    room.onMessage<{ code?: string }>('error', (message) => {
      if (message.code === 'RATE_LIMITED' || message.code === 'STALE_SEQUENCE')
        rejectedValidCommands += 1;
      else serverErrors += 1;
    });
    room.onLeave(() => {
      if (running) unexpectedDisconnects += 1;
    });
    rooms.push(room);
  }

  await waitFor(
    () => rooms.every((room) => room.state.players?.size === NETWORK_CONFIG.roomCapacity),
    10_000,
    'all ten players in replicated state',
  );
  phase = 'traffic';

  rooms.forEach((room, index) => {
    const random = makeRandom(index + 1);
    let sequence = 0;
    intervals.push(
      setInterval(() => {
        const direction = directions[Math.floor(random() * directions.length)]!;
        room.send('command', {
          type: 'move',
          sequence: ++sequence,
          direction,
          clientSentAtMs: Date.now(),
        });
        commandsSent += 1;
      }, NETWORK_CONFIG.tickMs),
    );
    room.ping((latency) => latencySamples.push(latency));
  });

  await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
  phase = 'client leave';
  running = false;
  intervals.forEach(clearInterval);
  await Promise.all(rooms.map((room) => room.leave(true)));
  await waitFor(asyncRoomDisposed, 5_000, 'empty room disposal and code cleanup');
  phase = 'report';

  const endMemory = process.memoryUsage().heapUsed;
  const averageLatency = latencySamples.length
    ? Math.round(latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length)
    : null;
  const result = {
    durationMs: Date.now() - startedAt,
    connectedPlayers: rooms.length,
    commandsSent,
    rejectedValidCommands,
    unexpectedDisconnects,
    averageLatencyMs: averageLatency,
    serverErrors,
    heapStartBytes: startMemory,
    heapEndBytes: endMemory,
    heapDeltaBytes: endMemory - startMemory,
    cleanup: 'passed',
  };
  console.log(JSON.stringify(result, null, 2));
  if (rejectedValidCommands || unexpectedDisconnects || serverErrors)
    throw new Error('Load test recorded rejected valid traffic, disconnects, or server errors.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  phase = 'final cleanup';
  running = false;
  intervals.forEach(clearInterval);
  await Promise.allSettled(
    rooms.filter((room) => room.connection?.isOpen).map((room) => room.leave(true)),
  );
  gameServer.transport.shutdown();
}

clearTimeout(watchdog);
process.exit(process.exitCode ?? 0);

function asyncRoomDisposed() {
  return fetch(`${httpUrl}/health`, { signal: AbortSignal.timeout(1_000) })
    .then((response) => response.json() as Promise<{ activeRooms: number }>)
    .then((health) => health.activeRooms === 0)
    .catch(() => false);
}
