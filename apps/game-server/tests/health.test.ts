// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { createGameServer } from '../src/app';

let server: ColyseusTestServer;
beforeAll(async () => {
  server = await boot(createGameServer());
});
afterEach(async () => server.cleanup());
afterAll(async () => server.shutdown());

describe('HTTP health and lobby', () => {
  it('serves health without a WebSocket and creates/resolves an exact room code', async () => {
    const health = await server.http.get('/health');
    expect(health.data).toMatchObject({ status: 'ok', service: 'odd-tower-game-server' });

    const created = await server.http.post('/rooms');
    expect(created.data.roomCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/u);
    const resolved = await server.http.get(`/rooms/${created.data.roomCode.toLowerCase()}`);
    expect(resolved.data).toMatchObject({
      roomId: created.data.roomId,
      roomCode: created.data.roomCode,
      floorId: 'floor_1',
      maxPlayers: 10,
    });
  });

  it('returns specific client errors for invalid and unknown room codes', async () => {
    await expect(server.http.get('/rooms/BAD-00')).rejects.toMatchObject({ statusCode: 400 });
    await expect(server.http.get('/rooms/ZZZ999')).rejects.toMatchObject({ statusCode: 404 });
  });
});
