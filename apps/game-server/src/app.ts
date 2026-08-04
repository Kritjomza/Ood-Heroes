import cors from 'cors';
import express from 'express';
import { Server, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { RoomCodeRegistry } from './lobby/RoomCodeRegistry.js';
import { FloorOneRoom } from './rooms/FloorOneRoom.js';
import { readServerConfig, type ServerConfig } from './config.js';
import type { AuthVerifier } from './auth/AuthVerifier.js';
import type { ActiveUserRegistry } from './auth/ActiveUserRegistry.js';
import type { PlayerPersistenceService } from './persistence/persistence-types.js';
import type { PersistenceHealth } from './persistence/PersistenceHealth.js';
import { createPlayerRouter } from './api/playerRoutes.js';
import { requestContext } from './api/requestContext.js';
import { PersistenceQueue } from './persistence/PersistenceQueue.js';
import { authMiddleware } from './auth/authMiddleware.js';
import { MmoZoneRoom, type MmoZoneRoomOptions } from './mmo/channels/MmoZoneRoom.js';
import { MmoInstanceRoom } from './mmo/instances/MmoInstanceRoom.js';

export type PersistenceDependencies = {
  authVerifier: AuthVerifier;
  persistence: PlayerPersistenceService;
  activeUsers: ActiveUserRegistry;
  health: PersistenceHealth;
  queue?: PersistenceQueue;
};

export function createGameServer(
  config: ServerConfig = readServerConfig(),
  registry = new RoomCodeRegistry(),
  roomOptions: { reconnectGraceSeconds?: number } = {},
  persistenceDependencies?: PersistenceDependencies,
  mmoDependencies?: MmoZoneRoomOptions,
) {
  const server = new Server({
    transport: new WebSocketTransport(),
    greet: false,
    express: (app) => {
      app.use(cors({ origin: config.clientOrigin }));
      app.use(express.json({ limit: '8kb' }));
      app.use(requestContext);
      if (persistenceDependencies) {
        app.use('/api/player', createPlayerRouter(persistenceDependencies));
        app.post(
          '/api/rooms',
          authMiddleware(persistenceDependencies.authVerifier),
          async (_request, response) => {
            try {
              const room = await matchMaker.createRoom('floor_1', {});
              const entry = registry.getByRoomId(room.roomId);
              if (!entry) throw new Error('Room code registration failed');
              response.status(201).json({ ...entry, floorId: 'floor_1' });
            } catch {
              response
                .status(500)
                .json({ code: 'SERVER_ERROR', message: 'Unable to create room.' });
            }
          },
        );
        app.get(
          '/api/rooms/:code',
          authMiddleware(persistenceDependencies.authVerifier),
          (request, response) => {
            const result = registry.resolve(request.params.code);
            if (result.ok) {
              response.json({ ...result.value, floorId: 'floor_1' });
              return;
            }
            const status =
              result.code === 'INVALID_ROOM_CODE' ? 400 : result.code === 'ROOM_FULL' ? 409 : 404;
            response
              .status(status)
              .json({ code: result.code, message: roomErrorMessage(result.code) });
          },
        );
        app.get('/api/persistence/health', async (_request, response) => {
          response.json(await persistenceDependencies.health.probe());
        });
        app.get('/ready', async (_request, response) => {
          const health = await persistenceDependencies.health.probe(true);
          response.status(health.status === 'healthy' ? 200 : 503).json(health);
        });
      } else {
        app.get('/ready', (_request, response) =>
          response.json({ status: 'healthy', persistence: 'not-configured' }),
        );
      }
      if (process.env.ODD_TOWER_TEST_MODE === '1') {
        app.post('/test/rooms/:roomId/control', (request, response) => {
          const room = matchMaker.getLocalRoomById(request.params.roomId) as
            | FloorOneRoom
            | undefined;
          if (!room) {
            response.status(404).json({ ok: false, code: 'ROOM_NOT_FOUND' });
            return;
          }
          response.json(
            room.applyTestControl(
              String(request.body?.action ?? ''),
              String(request.body?.displayName ?? ''),
            ),
          );
        });
        app.get('/test/rooms/:roomId/metrics', (request, response) => {
          const room = matchMaker.getLocalRoomById(request.params.roomId) as
            | FloorOneRoom
            | undefined;
          if (!room) {
            response.status(404).json({ ok: false, code: 'ROOM_NOT_FOUND' });
            return;
          }
          response.json(room.diagnostics());
        });
      }
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
  server.define('floor_1', FloorOneRoom, {
    registry,
    ...roomOptions,
    ...(persistenceDependencies
      ? {
          authVerifier: persistenceDependencies.authVerifier,
          persistence: persistenceDependencies.persistence,
          activeUsers: persistenceDependencies.activeUsers,
          persistenceQueue: persistenceDependencies.queue ?? new PersistenceQueue(),
          persistenceHealth: persistenceDependencies.health,
        }
      : {}),
  });
  if (mmoDependencies?.flags.worldEnabled)
    server.define('mmo_zone_v1', MmoZoneRoom, mmoDependencies);
  if (mmoDependencies?.flags.worldEnabled && mmoDependencies.instances)
    server.define('mmo_instance_v1', MmoInstanceRoom, {
      authVerifier: mmoDependencies.authVerifier,
      instances: mmoDependencies.instances,
      ...(mmoDependencies.instanceRepository ? { repository: mmoDependencies.instanceRepository } : {}),
    });
  return server;
}

function roomErrorMessage(code: 'INVALID_ROOM_CODE' | 'ROOM_NOT_FOUND' | 'ROOM_FULL') {
  if (code === 'INVALID_ROOM_CODE') return 'Room codes contain six supported characters.';
  if (code === 'ROOM_FULL') return 'That room is full.';
  return 'That room could not be found.';
}
