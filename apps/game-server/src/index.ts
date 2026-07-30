import { createGameServer } from './app.js';
import { readServerConfig } from './config.js';

const config = readServerConfig();
const server = createGameServer(config);
await server.listen(config.port, config.host);
console.log(`Odd Tower game server listening on http://${config.host}:${config.port}`);
