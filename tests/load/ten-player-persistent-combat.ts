import { createClient } from '@supabase/supabase-js';
import { ColyseusSDK, type Room } from '@colyseus/sdk';
import { NETWORK_CONFIG, PROTOCOL_VERSION } from '@odd-tower/network-protocol';
import { createGameServer } from '../../apps/game-server/src/app.js';
import { SupabaseAuthVerifier } from '../../apps/game-server/src/auth/SupabaseAuthVerifier.js';
import { ActiveUserRegistry } from '../../apps/game-server/src/auth/ActiveUserRegistry.js';
import { SupabasePersistenceService } from '../../apps/game-server/src/persistence/SupabasePersistenceService.js';
import { PersistenceQueue } from '../../apps/game-server/src/persistence/PersistenceQueue.js';
import { PersistenceHealth } from '../../apps/game-server/src/persistence/PersistenceHealth.js';

type LoadState = {
  serverTick: number;
  players: Map<string, unknown>;
  monsters: Map<string, { status: string }>;
};

const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'] as const;
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const durationMs = Number(process.env.PERSISTENT_LOAD_DURATION_MS ?? 60_000);
const port = Number(process.env.PERSISTENT_LOAD_SERVER_PORT ?? 2572);
process.env.ODD_TOWER_TEST_MODE = '1';
const config = {
  url: process.env.SUPABASE_URL!,
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
  secretKey: process.env.SUPABASE_SECRET_KEY!,
  issuer: `${process.env.SUPABASE_URL!}/auth/v1`,
};
const password = 'OddTower-Persistent-Load-42!';
const admin = createClient(config.url, config.secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const persistence = new SupabasePersistenceService(config);
const queue = new PersistenceQueue();
const health = new PersistenceHealth(persistence, queue);
const activeUsers = new ActiveUserRegistry();
const server = createGameServer(
  { port, host: '127.0.0.1', clientOrigin: 'http://127.0.0.1:4173' },
  undefined,
  {},
  {
    authVerifier: new SupabaseAuthVerifier(config),
    persistence,
    activeUsers,
    queue,
    health,
  },
);
const userIds: string[] = [];
const rooms: Room<unknown, LoadState>[] = [];
let unexpectedDisconnects = 0;
let serverErrors = 0;
let peakMonsters = 0;
let running = true;

try {
  for (let index = 0; index < 10; index += 1) {
    const id = crypto.randomUUID();
    const email = `persistent-load-${id}@example.test`;
    const { error } = await admin.auth.admin.createUser({
      id,
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userIds.push(id);
    await persistence.initialize(id, `PersistentBot${index + 1}`, 'permanent');
  }
  const tokens: string[] = [];
  for (const id of userIds) {
    const auth = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auth.auth.signInWithPassword({
      email: `persistent-load-${id}@example.test`,
      password,
    });
    if (error || !data.session) throw error ?? new Error('No load session');
    tokens.push(data.session.access_token);
  }

  await server.listen(port, '127.0.0.1');
  const created = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokens[0]}` },
  });
  if (!created.ok) throw new Error('Persistent room creation failed');
  const summary = (await created.json()) as { roomId: string };
  for (let index = 0; index < tokens.length; index += 1) {
    const sdk = new ColyseusSDK(`ws://127.0.0.1:${port}`);
    const room = await sdk.joinById<LoadState>(summary.roomId, {
      accessToken: tokens[index],
      protocolVersion: PROTOCOL_VERSION,
    });
    room.onLeave(() => {
      if (running) unexpectedDisconnects += 1;
    });
    room.onMessage<{ code?: string }>('error', () => {
      serverErrors += 1;
    });
    room.onMessage('combat-event', () => undefined);
    room.onMessage('persistence', () => undefined);
    room.onStateChange((state) => {
      peakMonsters = Math.max(peakMonsters, state.monsters?.size ?? 0);
    });
    rooms.push(room);
  }
  await waitFor(() => rooms[0]?.state.players?.size === 10, 15_000);
  const firstMonster = [...rooms[0]!.state.monsters.keys()][0]!;
  for (const room of rooms) {
    room.send('command', {
      type: 'focus-target',
      targetMonsterId: firstMonster,
      clientSentAtMs: Date.now(),
    });
    room.send('command', { type: 'auto-hunt', enabled: true, clientSentAtMs: Date.now() });
  }
  const metricsUrl = `http://127.0.0.1:${port}/test/rooms/${summary.roomId}/metrics`;
  const startMetrics = (await (await fetch(metricsUrl)).json()) as { ticks: number };
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  const endMetrics = (await (await fetch(metricsUrl)).json()) as { ticks: number };
  const observedTicks = endMetrics.ticks - startMetrics.ticks;
  running = false;
  await Promise.all(rooms.map((room) => room.leave(true)));
  const flushed = await queue.flush(10_000);
  const { data: ledger, error: ledgerError } = await admin
    .from('reward_ledger')
    .select('user_id,reward_identity,source_type')
    .in('user_id', userIds)
    .eq('source_type', 'combat');
  if (ledgerError) throw ledgerError;
  const identities = new Set((ledger ?? []).map((row) => `${row.user_id}:${row.reward_identity}`));
  const effectiveHz = observedTicks / (durationMs / 1_000);
  const result = {
    durationMs,
    connectedPlayers: rooms.length,
    peakMonsters,
    observedTicks,
    effectiveHz,
    persistentRewards: ledger?.length ?? 0,
    uniquePersistentRewards: identities.size,
    unexpectedDisconnects,
    serverErrors,
    queue: queue.snapshot(),
    flushed,
    health: health.snapshot().status,
  };
  console.log(JSON.stringify(result, null, 2));
  if (
    observedTicks < (durationMs / NETWORK_CONFIG.tickMs) * 0.95 ||
    effectiveHz < 19 ||
    peakMonsters < 50 ||
    !ledger?.length ||
    identities.size !== ledger.length ||
    unexpectedDisconnects ||
    serverErrors ||
    !flushed ||
    queue.snapshot().depth ||
    queue.snapshot().active
  )
    throw new Error('Persistent combat load acceptance failed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  running = false;
  await Promise.allSettled(
    rooms.filter((room) => room.connection?.isOpen).map((room) => room.leave(true)),
  );
  server.transport.shutdown();
  await Promise.allSettled(userIds.map((id) => admin.auth.admin.deleteUser(id)));
}
process.exit(process.exitCode ?? 0);

async function waitFor(check: () => boolean, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for persistent load state');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
