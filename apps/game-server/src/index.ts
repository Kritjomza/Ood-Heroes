import { createGameServer } from './app.js';
import { readPersistenceConfig, readServerConfig } from './config.js';
import { SupabaseAuthVerifier } from './auth/SupabaseAuthVerifier.js';
import { ActiveUserRegistry } from './auth/ActiveUserRegistry.js';
import { SupabasePersistenceService } from './persistence/SupabasePersistenceService.js';
import { PersistenceQueue } from './persistence/PersistenceQueue.js';
import { PersistenceHealth } from './persistence/PersistenceHealth.js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@odd-tower/network-protocol';
import { randomUUID } from 'node:crypto';
import { ChannelRegistry } from './mmo/channels/ChannelRegistry.js';
import { WorldDirectory } from './mmo/directory/WorldDirectory.js';
import { readMmoFeatureFlags } from './mmo/featureFlags.js';
import { SupabaseWorldCheckpointRepository } from './mmo/persistence/WorldCheckpointRepository.js';
import { PrivateInstanceRegistry } from './mmo/instances/PrivateInstanceRegistry.js';
import { SupabaseMmoProgressionRepository } from './mmo/persistence/MmoProgressionRepository.js';
import { SupabaseMmoRewardRepository } from './mmo/persistence/MmoRewardRepository.js';
import { PartyRegistry } from './mmo/social/PartyRegistry.js';
import { SupabaseMmoInstanceRepository } from './mmo/persistence/MmoInstanceRepository.js';

const config = readServerConfig();
const persistenceConfigured = Boolean(
  process.env.SUPABASE_URL &&
    process.env.SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SECRET_KEY,
);
if (!persistenceConfigured && process.env.ODD_TOWER_TEST_MODE !== '1')
  throw new Error('Supabase server configuration is required');

const server = persistenceConfigured ? createPersistentServer() : createGameServer(config);
await server.listen(config.port, config.host);
console.log(`Odd Tower game server listening on http://${config.host}:${config.port}`);

function createPersistentServer() {
  const persistenceConfig = readPersistenceConfig();
  const persistence = new SupabasePersistenceService(persistenceConfig);
  const queue = new PersistenceQueue();
  const health = new PersistenceHealth(persistence, queue);
  const authVerifier = new SupabaseAuthVerifier(persistenceConfig);
  const channels = new ChannelRegistry({
    capacity: 30,
    createId: () => `channel-${randomUUID()}`,
    nowMs: Date.now,
  });
  const directory = new WorldDirectory({
    channels,
    createLeaseId: randomUUID,
    leaseDurationMs: 30_000,
  });
  const instances = new PrivateInstanceRegistry(randomUUID);
  const party = new PartyRegistry(randomUUID);
  const checkpointClient = createClient<Database>(
    persistenceConfig.url,
    persistenceConfig.secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return createGameServer(
    config,
    undefined,
    {},
    {
      authVerifier,
      persistence,
      activeUsers: new ActiveUserRegistry(),
      health,
      queue,
    },
    {
      flags: readMmoFeatureFlags(),
      authVerifier,
      directory,
      checkpoints: new SupabaseWorldCheckpointRepository(checkpointClient),
      progression: new SupabaseMmoProgressionRepository(checkpointClient),
      rewards: new SupabaseMmoRewardRepository(checkpointClient),
      party,
      instances,
      instanceRepository: new SupabaseMmoInstanceRepository(checkpointClient),
    },
  );
}
