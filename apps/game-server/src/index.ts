import { createGameServer } from './app.js';
import { readPersistenceConfig, readServerConfig } from './config.js';
import { SupabaseAuthVerifier } from './auth/SupabaseAuthVerifier.js';
import { ActiveUserRegistry } from './auth/ActiveUserRegistry.js';
import { SupabasePersistenceService } from './persistence/SupabasePersistenceService.js';
import { PersistenceQueue } from './persistence/PersistenceQueue.js';
import { PersistenceHealth } from './persistence/PersistenceHealth.js';

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
  return createGameServer(
    config,
    undefined,
    {},
    {
      authVerifier: new SupabaseAuthVerifier(persistenceConfig),
      persistence,
      activeUsers: new ActiveUserRegistry(),
      health,
      queue,
    },
  );
}
