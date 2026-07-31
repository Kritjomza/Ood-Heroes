// @vitest-environment node
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthVerifier } from '../src/auth/AuthVerifier';
import { ActiveUserRegistry } from '../src/auth/ActiveUserRegistry';
import { requestContext } from '../src/api/requestContext';
import { createPlayerRouter } from '../src/api/playerRoutes';
import { InMemoryPersistenceService } from '../src/persistence/InMemoryPersistenceService';
import { PersistenceHealth } from '../src/persistence/PersistenceHealth';
import { PersistenceQueue } from '../src/persistence/PersistenceQueue';

const userId = '10000000-0000-4000-8000-000000000001';
const verifier: AuthVerifier = {
  async verifyAccessToken(token) {
    if (token !== 'valid') throw new Error('AUTH_INVALID');
    return { userId, accountKind: 'guest', email: null };
  },
};

function fixture() {
  const persistence = new InMemoryPersistenceService();
  const activeUsers = new ActiveUserRegistry();
  const health = new PersistenceHealth(persistence, new PersistenceQueue());
  const app = express();
  app.use(express.json({ limit: '8kb' }), requestContext);
  app.use(
    '/api/player',
    createPlayerRouter({ authVerifier: verifier, persistence, activeUsers, health }),
  );
  return { app, persistence, activeUsers };
}

describe('protected player routes', () => {
  it('requires a Bearer token and returns request-scoped safe errors', async () => {
    const { app } = fixture();
    const response = await request(app).get('/api/player/bootstrap');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'AUTH_INVALID' });
    expect(response.body.error.requestId).toMatch(/[0-9a-f-]{36}/u);
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
