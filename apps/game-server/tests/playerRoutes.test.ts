// @vitest-environment node
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { AuthVerifier } from '../src/auth/AuthVerifier';
import { AuthenticationError } from '../src/auth/AuthVerifier';
import { ActiveUserRegistry } from '../src/auth/ActiveUserRegistry';
import { requestContext } from '../src/api/requestContext';
import { createPlayerRouter } from '../src/api/playerRoutes';
import { InMemoryPersistenceService } from '../src/persistence/InMemoryPersistenceService';
import { PersistenceHealth } from '../src/persistence/PersistenceHealth';
import { PersistenceQueue } from '../src/persistence/PersistenceQueue';
import type { PlayerPersistenceService } from '../src/persistence/persistence-types';
import { DomainError } from '../src/api/domainErrors';

const userId = '10000000-0000-4000-8000-000000000001';
const verifier: AuthVerifier = {
  async verifyAccessToken(token) {
    if (token === '') throw new AuthenticationError('AUTH_REQUIRED');
    if (token !== 'valid') throw new AuthenticationError('AUTH_INVALID');
    return { userId, accountKind: 'guest', email: null };
  },
};

function fixture(
  persistence: PlayerPersistenceService = new InMemoryPersistenceService(),
  logBootstrapFailure = vi.fn(),
) {
  const activeUsers = new ActiveUserRegistry();
  const health = new PersistenceHealth(persistence, new PersistenceQueue());
  const app = express();
  app.use(express.json({ limit: '8kb' }), requestContext);
  app.use(
    '/api/player',
    createPlayerRouter({
      authVerifier: verifier,
      persistence,
      activeUsers,
      health,
      logBootstrapFailure,
    }),
  );
  return { app, persistence, activeUsers, logBootstrapFailure };
}

describe('protected player routes', () => {
  it('requires a Bearer token and returns request-scoped safe errors', async () => {
    const { app } = fixture();
    const response = await request(app).get('/api/player/bootstrap');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(response.body.error.requestId).toMatch(/[0-9a-f-]{36}/u);
  });

  it('does not convert invalid authentication into a persistence 503', async () => {
    const persistence = new InMemoryPersistenceService();
    const bootstrap = vi.spyOn(persistence, 'bootstrap');
    const { app } = fixture(persistence);
    const response = await request(app)
      .get('/api/player/bootstrap')
      .set('authorization', 'Bearer invalid');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_INVALID');
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it.each([
    [new DomainError('PROFILE_NOT_FOUND'), 404, 'PROFILE_NOT_FOUND'],
    [new Error('database offline'), 503, 'PERSISTENCE_UNAVAILABLE'],
  ] as const)('maps bootstrap failures to safe HTTP responses', async (failure, status, code) => {
    const persistence = new InMemoryPersistenceService();
    vi.spyOn(persistence, 'bootstrap').mockRejectedValue(failure);
    const { app, logBootstrapFailure } = fixture(persistence);
    const response = await request(app)
      .get('/api/player/bootstrap')
      .set('authorization', 'Bearer valid');
    expect(response.status).toBe(status);
    expect(response.body.error).toMatchObject({ code });
    expect(logBootstrapFailure).toHaveBeenCalledWith({
      requestId: response.body.error.requestId,
      stage: 'load',
      code,
    });
    expect(JSON.stringify(logBootstrapFailure.mock.calls)).not.toContain('database offline');
  });

  it('initializes and restores an authoritative bootstrap', async () => {
    const { app } = fixture();
    const initialized = await request(app)
      .post('/api/player/bootstrap')
      .set('authorization', 'Bearer valid')
      .send({ displayName: 'Odd Guest' });
    expect(initialized.status).toBe(200);
    expect(initialized.body.data).toMatchObject({
      profile: { userId, displayName: 'Odd Guest' },
      currencies: { gold: 500, gem: 300 },
    });
    const restored = await request(app)
      .get('/api/player/bootstrap')
      .set('authorization', 'Bearer valid');
    expect(restored.body.data.profile.userId).toBe(userId);
  });

  it('requires UUID idempotency and blocks progression mutation during combat', async () => {
    const { app, activeUsers } = fixture();
    await request(app)
      .post('/api/player/bootstrap')
      .set('authorization', 'Bearer valid')
      .send({ displayName: 'Odd Guest' });
    const missing = await request(app)
      .post('/api/player/summon')
      .set('authorization', 'Bearer valid')
      .send({ payload: { bannerId: 'standard_odd_heroes' } });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('IDEMPOTENCY_REQUIRED');
    activeUsers.reserve(userId, 'room-a');
    const restricted = await request(app)
      .post('/api/player/summon')
      .set('authorization', 'Bearer valid')
      .send({
        idempotencyKey: '20000000-0000-4000-8000-000000000001',
        payload: { bannerId: 'standard_odd_heroes' },
      });
    expect(restricted.status).toBe(409);
    expect(restricted.body.error.code).toBe('ACTIVE_COMBAT_RESTRICTION');
  });
});
