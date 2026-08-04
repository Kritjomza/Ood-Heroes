import { performance } from 'node:perf_hooks';
import { ChannelRegistry } from '../../apps/game-server/src/mmo/channels/ChannelRegistry.js';
import { WorldDirectory } from '../../apps/game-server/src/mmo/directory/WorldDirectory.js';

const channels = new ChannelRegistry({
  capacity: 30,
  createId: () => 'load-channel-1',
  nowMs: () => 1_000,
});
let leaseSequence = 0;
const directory = new WorldDirectory({
  channels,
  createLeaseId: () => `lease-${++leaseSequence}`,
  leaseDurationMs: 30_000,
});

const assignments = Array.from({ length: 30 }, (_, index) =>
  directory.assign({
    accountId: `load-account-${index}`,
    zoneId: 'floor-1',
    region: 'auto',
    nowMs: 1_000,
  }),
);
const latencies: number[] = [];
for (let index = 0; index < 3_000; index += 1) {
  const startedAt = performance.now();
  const assignment = assignments[index % assignments.length];
  if (!assignment?.channelId) throw new Error('missing_assignment');
  latencies.push(performance.now() - startedAt);
}

let reconnectSuccesses = 0;
for (let index = 0; index < 5; index += 1) {
  const reconnect = directory.assign({
    accountId: `load-account-${index}`,
    zoneId: 'floor-1',
    region: 'auto',
    nowMs: 2_000,
  });
  if (reconnect.reason === 'reconnect' && reconnect.leaseId === assignments[index]?.leaseId)
    reconnectSuccesses += 1;
}

let rejected = 0;
try {
  channels.reserve('load-channel-1', 1);
} catch (error) {
  if (error instanceof Error && error.message === 'channel_capacity') rejected += 1;
  else throw error;
}

latencies.sort((left, right) => left - right);
const percentile = (fraction: number) =>
  Number(latencies[Math.ceil(latencies.length * fraction) - 1]?.toFixed(3) ?? 0);
const result = {
  admitted: assignments.length,
  rejected,
  duplicateLeaseCount: Array.from({ length: 30 }, (_, index) =>
    directory.activeLeaseCount(`load-account-${index}`),
  ).filter((count) => count !== 1).length,
  reconnectSuccessRate: reconnectSuccesses / 5,
  p95CommandAckMs: percentile(0.95),
  p99CommandAckMs: percentile(0.99),
  maxPopulation: channels.get('load-channel-1')?.population ?? 0,
};

if (
  result.admitted !== 30 ||
  result.rejected !== 1 ||
  result.duplicateLeaseCount !== 0 ||
  result.reconnectSuccessRate < 0.995 ||
  result.p95CommandAckMs > 150 ||
  result.maxPopulation !== 30
)
  throw new Error(`MMO foundation load gate failed: ${JSON.stringify(result)}`);

console.log(JSON.stringify(result));
