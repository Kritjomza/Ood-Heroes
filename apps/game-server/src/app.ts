import cors from 'cors';
import { Server, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { RoomCodeRegistry } from './lobby/RoomCodeRegistry.js';
import { FloorOneRoom } from './rooms/FloorOneRoom.js';
import { readServerConfig, type ServerConfig } from './config.js';

export function createGameServer(
  config: ServerConfig = readServerConfig(),
  registry = new RoomCodeRegistry(),
  roomOptions: { reconnectGraceSeconds?: number } = {},
) {
  const server = new Server({
    transport: new WebSocketTransport(),
    greet: false,
    express: (app) => {
      app.use(cors({ origin: config.clientOrigin }));
      app.get('/health', (_request, response) =>
        response.json({
          status: 'ok',
          service: 'odd-tower-game-server',
          activeRooms: registry.size,
        }),
      );
      app.post('/rooms', async (_request, response) => {
        try {
          const room = await matchMaker.createRoom('floor_1', {});
          const entry = registry.getByRoomId(room.roomId);
          if (!entry) throw new Error('Room code registration failed');
          response.status(201).json({ ...entry, floorId: 'floor_1' });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') console.error('Room creation failed', error);
          response.status(500).json({ code: 'SERVER_ERROR', message: 'Unable to create room.' });
        }
      });
      app.get('/rooms/:code', (request, response) => {
        const result = registry.resolve(request.params.code);
        if (result.ok) {
          response.json({ ...result.value, floorId: 'floor_1' });
          return;
        }
        const status =
          result.code === 'INVALID_ROOM_CODE' ? 400 : result.code === 'ROOM_FULL' ? 409 : 404;
        response.status(status).json({ code: result.code, message: roomErrorMessage(result.code) });
      });
    },
  });
  server.define('floor_1', FloorOneRoom, { registry, ...roomOptions });
  return server;
}

function roomErrorMessage(code: 'INVALID_ROOM_CODE' | 'ROOM_NOT_FOUND' | 'ROOM_FULL') {
  if (code === 'INVALID_ROOM_CODE') return 'Room codes contain six supported characters.';
  if (code === 'ROOM_FULL') return 'That room is full.';
  return 'That room could not be found.';
}
